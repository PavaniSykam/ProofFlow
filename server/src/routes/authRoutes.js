const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { authSchemas } = require('../validators/schemas');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/login',
  loginLimiter,
  validate(authSchemas.login),
  asyncHandler(authController.login)
);

router.post('/logout', asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getMe));
router.post(
  '/change-password',
  authenticate,
  validate(authSchemas.changePassword),
  asyncHandler(authController.changePassword)
);

module.exports = router;
