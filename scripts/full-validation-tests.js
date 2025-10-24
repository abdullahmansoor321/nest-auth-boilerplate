/*
  full-validation-tests.js
  - Runs a comprehensive set of validation and edge-case tests against /auth/register and /auth/login.
  - Collects any created emails and deletes them at the end via Prisma.
  - Usage: node ./scripts/full-validation-tests.js
*/

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const created = [];

const cases = [
  { name: 'missing password', payload: { email: `e2e.x.${Date.now()}@example.com` }, expect: 400 },
  { name: 'invalid email format', payload: { email: 'bad-email', password: 'password123', name: 'Bad' }, expect: 400 },
  { name: 'short password', payload: { email: `e2e.short.${Date.now()}@example.com`, password: '1', name: 'Short' }, expect: 400 },
  { name: 'valid minimal', payload: { email: `e2e.good.${Date.now()}@example.com`, password: 'password123', name: 'Good' }, expect: 201 },
  { name: 'long email', payload: { email: `${'a'.repeat(200)}@example.com`, password: 'password123', name: 'Long' }, expectNot500: true },
  { name: 'unicode name', payload: { email: `e2e.uni.${Date.now()}@example.com`, password: 'password123', name: 'José 🚀' }, expect: 201 },
  { name: 'sql injection like', payload: { email: "' OR '1'='1@example.com", password: 'password123', name: 'Inject' }, expectNot500: true },
  { name: 'whitespace email', payload: { email: '  spaced@example.com  ', password: 'password123', name: 'Space' }, expectNot500: true },
];

async function run() {
  console.log('Starting full validation tests against', BASE);

  for (const c of cases) {
    console.log('\nCase:', c.name);
    try {
      const res = await fetch(BASE + '/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c.payload),
      });
      const text = await res.text();
      console.log('Status:', res.status, 'Body:', text);

      if (c.expect && res.status !== c.expect) {
        console.warn('  ✖ Unexpected status (expected', c.expect, ')');
      }
      if (c.expectNot500 && res.status === 500) {
        console.warn('  ✖ Server error for case that should not 500');
      }

      // If created, store email for cleanup and also check login
      if (res.status === 200 || res.status === 201) {
        try {
          const body = JSON.parse(text);
          const email = body?.data?.email || c.payload.email;
          if (email) created.push(email);

          // Attempt login
          const pw = c.payload.password || 'password123';
          const login = await fetch(BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pw }),
          });
          const loginText = await login.text();
          console.log('  Login status:', login.status, 'Body:', loginText);
        } catch (e) {
          console.warn('  Failed parsing body or login', e.message || e);
        }
      }
    } catch (e) {
      console.error('Request failed:', e.message || e);
    }
  }

  console.log('\nTests complete. Created accounts tracked:', created.length);
  if (created.length) {
    console.log('Attempting cleanup of created accounts via Prisma...');
    try {
      for (const email of created) {
        try {
          const deleted = await prisma.user.deleteMany({ where: { email } });
          console.log('Deleted', email, 'count', deleted.count);
        } catch (e) {
          console.warn('Failed to delete', email, e.message || e);
        }
      }
    } catch (e) {
      console.error('Cleanup error:', e.message || e);
    }
  }

  await prisma.$disconnect();
  console.log('Done.');
}

run().catch((e) => { console.error('Fatal', e); process.exit(1); });
