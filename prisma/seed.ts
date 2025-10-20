import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface PrismaError extends Error {
  code?: string;
}

function isPrismaError(error: unknown): error is PrismaError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as PrismaError).code === 'string'
  );
}

async function main() {
  // Remove all existing users to make the seed idempotent
  try {
    await prisma.user.deleteMany();
  } catch (e: unknown) {
    // Prisma may attempt transactions for certain operations which require a replica set on MongoDB.
    // If running a standalone MongoDB (e.g. local Compass), fall back to dropping the collection directly.
    if (isPrismaError(e) && e.code === 'P2031') {
      console.warn(
        'deleteMany failed due to missing replica set (P2031). Falling back to dropping the collection.',
      );
      try {
        // Drop the underlying collection created by Prisma. The collection name is `User` (capitalized from the model name).
        await prisma.$runCommandRaw({ drop: 'User' });
      } catch (dropErr) {
        console.warn('Failed to drop collection via $runCommandRaw:', dropErr);
      }
    } else {
      throw e;
    }
  }

  const password = 'password123';
  const hashed = await bcrypt.hash(password, 10);

  // Prepare sample users
  const users = [
    { name: 'Admin User', email: 'admin@example.com', password: hashed },
    { name: 'Jane Doe', email: 'jane.doe@example.com', password: hashed },
  ];

  // Use createMany for efficient batch insert
  try {
    const result = await prisma.user.createMany({
      data: users,
    });
    console.log(`✓ Created ${result.count} users successfully.`);
  } catch (e: unknown) {
    if (isPrismaError(e) && e.code === 'P2031') {
      console.warn(
        'Prisma createMany failed due to missing replica set (P2031). Falling back to $runCommandRaw insert.',
      );
      try {
        const now = { $date: new Date().toISOString() };
        const docs = users.map((u) => ({
          ...u,
          createdAt: now,
          updatedAt: now,
        }));
        await prisma.$runCommandRaw({ insert: 'User', documents: docs });
        console.log(`✓ Created ${users.length} users via raw insert.`);
      } catch (rawErr) {
        console.error('Failed to insert documents via $runCommandRaw:', rawErr);
        throw rawErr;
      }
    } else {
      throw e;
    }
  }

  console.log('Seeding finished.');
}

main()
  .then(() => console.log('Seed successful'))
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
