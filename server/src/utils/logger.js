/**
 * Simple structured logger. 
 * Uses console in dev; can be replaced with pino/winston for production.
 * Never logs secrets or password hashes.
 */
const config = require('../config/env');

const logger = {
  info: (...args) => console.log(`[INFO]`, ...args),
  warn: (...args) => console.warn(`[WARN]`, ...args),
  error: (...args) => console.error(`[ERROR]`, ...args),
  debug: (...args) => {
    if (!config.isProduction) {
      console.log(`[DEBUG]`, ...args);
    }
  },
};

module.exports = logger;
