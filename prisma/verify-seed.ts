import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(`\nFound ${users.length} users in database:\n`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
