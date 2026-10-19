/**
 * Environment configuration with fail-fast validation.
 * Every required var is checked at startup; missing vars crash immediately.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const required = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLIENT_ORIGIN',
  'SEED_DEFAULT_PASSWORD',
];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientOrigin: process.env.CLIENT_ORIGIN,
  cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxUploadMB: parseInt(process.env.MAX_UPLOAD_MB, 10) || 5,
  schedulerIntervalSeconds: parseInt(process.env.SCHEDULER_INTERVAL_SECONDS, 10) || 60,
  seedDefaultPassword: process.env.SEED_DEFAULT_PASSWORD,
  ai: {
    enabled: process.env.AI_ENABLED === 'true',
    provider: process.env.AI_PROVIDER || 'openai',
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'gpt-4o-mini',
  },
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

module.exports = config;
