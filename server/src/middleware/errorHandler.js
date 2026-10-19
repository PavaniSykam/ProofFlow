const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Centralized error handler.
 * Maps validation, Mongoose, JWT, Multer, and AppError to the
 * standard response shape: { error: { code, message, details? } }
 */
const errorHandler = (err, req, res, _next) => {
  // Log full error server-side
  logger.error(`${req.method} ${req.originalUrl}:`, err.message);
  if (!config.isProduction) {
    logger.debug(err.stack);
  }

  // AppError (our business logic errors)
  if (err.isOperational) {
    return res.status(err.httpStatus).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || undefined,
      },
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: `Invalid ${err.path}: ${err.value}`,
      },
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_KEY',
        message: `A record with this ${field} already exists`,
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File exceeds the ${config.maxUploadMB}MB limit`,
      },
    });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: { code: 'TOO_MANY_FILES', message: 'Too many files uploaded' },
    });
  }

  // Unknown error — never expose internals in production
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isProduction ? 'An unexpected error occurred' : err.message,
    },
  });
};

module.exports = errorHandler;
