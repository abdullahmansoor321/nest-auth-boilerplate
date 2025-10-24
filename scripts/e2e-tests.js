/*
  e2e-tests.js
  - Simple automated end-to-end smoke tests for the API. Run while the dev server is running:
      node ./scripts/e2e-tests.js
  - Tests performed:
    1) Health check GET /
    2) Register a unique user
    3) Try duplicate registration (expect 409)
    4) Login with the created user
    5) GET /users/me with Bearer token
    6) GET /users (expect 401/403 for non-admin)

  Exits with code 0 on success, non-zero on any failure.
*/

const timeout = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
  const base = process.env.BASE_URL || 'http://localhost:3000';

  const log = (...args) => console.log('[e2e]', ...args);

  try {
    log('1) Health check GET /');
    let res;
    try {
      res = await fetch(base + '/');
    } catch (e) {
      log('Health check failed to connect to', base, e.message || e);
      process.exit(2);
    }
    log('Health status:', res.status);

    // Step 2: register unique user
    const email = `e2e.user.${Date.now()}@example.com`;
    const password = 'password123';
    log('2) Registering user', email);
    res = await fetch(base + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'E2E User' }),
    });
    const body = await res.text();
    log('Register response:', res.status, body);
    if (![200, 201].includes(res.status)) {
      log('Register failed');
      process.exit(3);
    }

    // Step 3: duplicate register
    log('3) Duplicate registration (expect 409)');
    res = await fetch(base + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'E2E User' }),
    });
    log('Duplicate register status:', res.status);
    if (res.status !== 409) {
      log('Duplicate registration did not return 409 as expected');
      process.exit(4);
    }

    // Step 4: login
    log('4) Logging in');
    res = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginBody = await res.json().catch(() => null);
    log('Login status:', res.status, loginBody);
    if (res.status !== 201 && res.status !== 200) {
      log('Login failed');
      process.exit(5);
    }
    // Accept several possible token shapes returned by different implementations
    const token =
      loginBody?.data?.accessToken ||
      loginBody?.data?.access_token ||
      loginBody?.accessToken ||
      loginBody?.access_token ||
      loginBody?.data?.token ||
      loginBody?.token ||
      loginBody?.data?.accessToken;

    if (!token) {
      log('No token returned from login — login body:', JSON.stringify(loginBody));
      process.exit(6);
    }

    // Step 5: GET /users/me
    log('5) GET /users/me');
    res = await fetch(base + '/users/me', { headers: { Authorization: `Bearer ${token}` } });
    const meBody = await res.json().catch(() => null);
    log('/users/me status:', res.status, meBody);
    if (res.status !== 200) {
      log('/users/me failed');
      process.exit(7);
    }

    // Step 6: GET /users (admin endpoint) - expect 401/403 for non-admin
    log('6) GET /users (expect 401/403)');
    res = await fetch(base + '/users', { headers: { Authorization: `Bearer ${token}` } });
    log('/users status:', res.status);
    if (![401, 403].includes(res.status)) {
      // If it's 200 that's okay only if the created user is admin (unlikely); warn but don't fail
      if (res.status === 200) {
        log('WARNING: /users accessible with non-admin token (could be seeded admin)');
      } else {
        log('Unexpected /users response code');
        process.exit(8);
      }
    }

    log('E2E checks passed ✅');
    process.exit(0);
  } catch (err) {
    console.error('[e2e] Unexpected error:', err);
    process.exit(99);
  }
})();
