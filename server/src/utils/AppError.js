/**
 * Custom application error class.
 * All business-logic errors should use this so the error handler
 * can produce the standard { error: { code, message, details } } body.
 */
class AppError extends Error {
  constructor(code, httpStatus, message, details = null) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
