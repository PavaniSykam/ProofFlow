const request = require('supertest');
const app = require('../src/app');

const DEFAULT_PASSWORD = 'ProofFlow@123';

/**
 * Log in a user and return their session cookie
 */
async function loginUser(email, password = DEFAULT_PASSWORD) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(`Failed to login as ${email}: ${JSON.stringify(res.body)}`);
  }

  // Extract token cookie
  const cookies = res.headers['set-cookie'];
  const tokenCookie = cookies.find((c) => c.startsWith('token='));
  return {
    cookie: tokenCookie ? tokenCookie.split(';')[0] : '',
    user: res.body.user,
  };
}

module.exports = {
  loginUser,
  app,
};
