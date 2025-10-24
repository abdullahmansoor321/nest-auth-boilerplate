/*
  cleanup-test-data.js
  - Deletes test users created by the validation/e2e scripts.
  - Heuristic: deletes users where email contains 'e2e.' OR email contains 'e2e-' or '@example.com' with that pattern.
  - Usage: node ./scripts/cleanup-test-data.js
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Cleanup: connecting to database...');
  try {
    // pattern can be overridden by env var EMAIL_PATTERN (string to search for)
    const pattern = process.env.EMAIL_PATTERN || 'e2e.';

    console.log('Cleanup: deleting users where email contains:', pattern);

    const deleted = await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: pattern } },
          { email: { contains: 'e2e-' } },
        ],
      },
    });

    console.log('Cleanup complete. Deleted count:', deleted.count);
  } catch (e) {
    console.error('Cleanup failed:', e.message || e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

run();
