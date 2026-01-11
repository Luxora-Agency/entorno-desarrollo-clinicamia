const app = require('../../server');
const prisma = require('../../db/prisma');
const crypto = require('crypto');

describe('Auth Flow Integration Test', () => {
  let userEmail;
  let userPassword = 'password123';
  let accessToken;
  let refreshToken;

  beforeAll(() => {
    userEmail = `test_${crypto.randomBytes(4).toString('hex')}@example.com`;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.refreshToken.deleteMany({
      where: { user: { email: userEmail } }
    });
    await prisma.userRole.deleteMany({
      where: { usuario: { email: userEmail } }
    });
    await prisma.usuario.delete({
      where: { email: userEmail }
    });
    await prisma.$disconnect();
  });

  test('1. Register User', async () => {
    const res = await app.request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Test',
        apellido: 'User',
        email: userEmail,
        password: userPassword,
        rol: 'PATIENT'
      })
    });

    if (res.status !== 201) {
      const body = await res.json();
      console.error('Register failed:', body);
    }

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.data.user.email).toBe(userEmail);
  });

  test('2. Login', async () => {
    const res = await app.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: userPassword
      })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.accessToken).toBeDefined();
    expect(data.data.refreshToken).toBeDefined();
    
    accessToken = data.data.accessToken;
    refreshToken = data.data.refreshToken;
  });

  test('3. Access Protected Route', async () => {
    const res = await app.request('/auth/me', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${accessToken}`
      }
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.user.email).toBe(userEmail);
  });

  test('4. Refresh Token', async () => {
    // Wait 1 second to ensure timestamps differ if needed, though not strictly necessary
    const res = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.accessToken).toBeDefined();
    expect(data.data.refreshToken).toBeDefined();
    expect(data.data.accessToken).not.toBe(accessToken);
    expect(data.data.refreshToken).not.toBe(refreshToken);

    accessToken = data.data.accessToken;
    refreshToken = data.data.refreshToken;
  });

  test('5. Logout', async () => {
    const res = await app.request('/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    expect(res.status).toBe(200);
  });

  test('6. Verify Refresh Token Invalid', async () => {
    const res = await app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    // Should be 401 Unauthorized
    expect(res.status).toBe(401);
  });
});
