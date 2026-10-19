const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Authenticate middleware: reads JWT from httpOnly cookie,
 * verifies it, loads the user fresh from the database, and
 * rejects inactive users or mismatched tokenVersion.
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      throw new AppError('INVALID_TOKEN', 401, 'Invalid or expired token');
    }

    // Fresh load: always check active status and tokenVersion
    const user = await User.findById(decoded.userId).populate('departmentId');
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 401, 'User no longer exists');
    }
    if (!user.isActive) {
      throw new AppError('ACCOUNT_DEACTIVATED', 401, 'Account has been deactivated');
    }
    if (user.tokenVersion !== decoded.tokenVersion) {
      throw new AppError('TOKEN_REVOKED', 401, 'Token has been revoked');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticate;
