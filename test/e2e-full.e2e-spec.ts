import request from 'supertest';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

function extractToken(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as Record<string, unknown>;
  const data = b['data'];
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const t1 = d['access_token'];
    if (typeof t1 === 'string') return t1;
    const t2 = d['accessToken'];
    if (typeof t2 === 'string') return t2;
    const t3 = d['token'];
    if (typeof t3 === 'string') return t3;
  }
  const ta = b['access_token'];
  if (typeof ta === 'string') return ta;
  const tb = b['accessToken'];
  if (typeof tb === 'string') return tb;
  const tc = b['token'];
  if (typeof tc === 'string') return tc;
  return undefined;
}

describe('Comprehensive E2E smoke tests', () => {
  jest.setTimeout(30000);

  it('health check should return 200', async () => {
    const res = await request(BASE).get('/');
    expect(res.status).toBe(200);
  });

  it('registration validation: missing fields should return 400', async () => {
    const res = await request(BASE).post('/auth/register').send({ email: 'no-pass@example.com' });
    expect([400, 422]).toContain(res.status);
  });

  it('registration validation: invalid email should return 400', async () => {
    const res = await request(BASE)
      .post('/auth/register')
      .send({ email: 'bad-email', password: 'password123', name: 'Bad' });
    expect([400, 422]).toContain(res.status);
  });

  it('registration: short password should be rejected', async () => {
    const email = `e2e.shortpw.${Date.now()}@example.com`;
    const res = await request(BASE)
      .post('/auth/register')
      .send({ email, password: '1', name: 'Short' });
    expect([400, 422]).toContain(res.status);
  });

  it('happy path: register -> login -> access protected endpoint', async () => {
    const email = `e2e.happy.${Date.now()}@example.com`;
    const password = 'password123';

    const reg = await request(BASE).post('/auth/register').send({ email, password, name: 'Happy' });
    expect([200, 201]).toContain(reg.status);

    // duplicate register
    const dup = await request(BASE).post('/auth/register').send({ email, password, name: 'Happy' });
    expect(dup.status).toBe(409);

    const login = await request(BASE).post('/auth/login').send({ email, password });
    expect([200, 201]).toContain(login.status);
    const token = extractToken(login.body);
    expect(token).toBeDefined();

    const me = await request(BASE).get('/users/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    const meBody = me.body as { data?: { email?: string } } | undefined;
    expect(meBody?.data?.email).toBe(email);
  });

  it('auth: invalid credentials return 401', async () => {
    const res = await request(BASE)
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'nope' });
    expect([401, 400]).toContain(res.status);
  });

  it('rbac: /users requires admin', async () => {
    // create regular user and ensure /users is forbidden
    const email = `e2e.rbac.${Date.now()}@example.com`;
    const password = 'password123';
    await request(BASE).post('/auth/register').send({ email, password, name: 'RBAC' });
    const login = await request(BASE).post('/auth/login').send({ email, password });
    const token = extractToken(login.body);
    const res = await request(BASE).get('/users').set('Authorization', `Bearer ${token}`);
    expect([401, 403]).toContain(res.status);
  });

  it('security: basic injection attempt should not crash and should be validated', async () => {
    const res = await request(BASE)
      .post('/auth/register')
      .send({ email: "' OR '1'='1@example.com", password: 'password123', name: 'Inject' });
    // Either rejected by validation or accepted as literal email; but server must not 500
    expect(res.status).not.toBe(500);
  });
});

export {};
