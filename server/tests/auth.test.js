const request = require('supertest');
const { setupTestDB } = require('./setup');
const { loginUser, app } = require('./testHelper');
const User = require('../src/models/User');

describe('ProofFlow Authentication & Mandatory Password Change Test Suite', () => {
  setupTestDB();

  const testEmail = 'ravi.teja@nexora-demo.example';
  const defaultPassword = 'ProofFlow@123';
  const newPassword = 'NewSecretPassword@2026';

  it('A1: Initial login returns mustChangePassword: true for seeded user', async () => {
    const session = await loginUser(testEmail, defaultPassword);
    expect(session.user).toBeDefined();
    expect(session.user.mustChangePassword).toBe(true);
    expect(session.cookie).toContain('token=');
  });

  it('A2: Rejects password change when current password is wrong', async () => {
    const session = await loginUser(testEmail, defaultPassword);

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', session.cookie)
      .send({
        currentPassword: 'WrongCurrentPassword!999',
        newPassword: newPassword,
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('INVALID_PASSWORD');
  });

  it('A3: Rejects password change when new password is too short (< 8 chars)', async () => {
    const session = await loginUser(testEmail, defaultPassword);

    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', session.cookie)
      .send({
        currentPassword: defaultPassword,
        newPassword: 'short',
      });

    expect(res.status).toBe(400);
    expect(res.body.error?.code).toBe('VALIDATION_ERROR');
  });

  it('A4: Successful password change issues fresh token, sets mustChangePassword: false, and preserves session', async () => {
    const session = await loginUser(testEmail, defaultPassword);
    const oldCookie = session.cookie;

    // Execute password change
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Cookie', oldCookie)
      .send({
        currentPassword: defaultPassword,
        newPassword: newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.mustChangePassword).toBe(false);
    expect(res.body.user.passwordHash).toBeUndefined(); // verify passwordHash is never exposed

    // Extract the fresh token cookie from response
    const setCookieHeaders = res.headers['set-cookie'];
    expect(setCookieHeaders).toBeDefined();
    const freshTokenCookie = setCookieHeaders.find((c) => c.startsWith('token='));
    expect(freshTokenCookie).toBeDefined();
    const newCookie = freshTokenCookie.split(';')[0];

    // Verify the refreshed session works immediately with /api/auth/me without re-login
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', newCookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user).toBeDefined();
    expect(meRes.body.user.email).toBe(testEmail);
    expect(meRes.body.user.mustChangePassword).toBe(false);

    // Verify the old token before password change is revoked (tokenVersion incremented)
    const oldMeRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', oldCookie);

    expect(oldMeRes.status).toBe(401);
    expect(oldMeRes.body.error?.code).toBe('TOKEN_REVOKED');

    // Verify user can now log in with the new password
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: newPassword,
      });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.user.mustChangePassword).toBe(false);
  });
});
