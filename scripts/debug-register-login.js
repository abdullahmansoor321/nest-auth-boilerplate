const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async function(){
  const BASE = process.env.BASE_URL || 'http://localhost:3000';
  const email = `debug.user.${Date.now()}@example.com`;
  const password = 'password123';
  console.log('Registering', email);
  try{
    const res = await fetch(BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Debug' }),
    });
    const text = await res.text();
    console.log('Register status', res.status, 'body', text);

    // wait a moment for DB consistency
    await new Promise((r)=>setTimeout(r,500));

    const user = await prisma.user.findUnique({ where: { email } });
    console.log('DB user record:', user ? { id: user.id, email: user.email, password: user.password } : null);

    console.log('Attempting login');
    const login = await fetch(BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginText = await login.text();
    console.log('Login status', login.status, 'body', loginText);

  }catch(e){
    console.error('Debug script error', e);
  }finally{
    await prisma.$disconnect();
  }
})();
