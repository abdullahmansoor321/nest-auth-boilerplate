const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('[check-prisma-direct] Connecting...');
    await prisma.$connect();
    console.log('[check-prisma-direct] Connected. Trying create...');

    const user = await prisma.user.create({
      data: {
        email: `prisma-check-${Date.now()}@example.com`,
        password: 'x',
        name: 'Prisma Check',
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
      },
    });

    console.log('[check-prisma-direct] Create succeeded:', user);
  } catch (err) {
    console.error('[check-prisma-direct] Error during Prisma operation:');
    console.error(err && err.code ? `code=${err.code}` : '', err);
    process.exitCode = 2;
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {}
  }
})();