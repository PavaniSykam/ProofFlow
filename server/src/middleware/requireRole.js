const AppError = require('../utils/AppError');

/**
 * Role-based access control middleware.
 * Checks that the authenticated user has at least one of the required roles.
 * Every user implicitly has the 'employee' role.
 * @param  {...string} roles - Required role keys (any match grants access)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('UNAUTHORIZED', 401, 'Authentication required'));
    }

    // Every user implicitly has the 'employee' role
    const userRoles = [...(req.user.roles || []), 'employee'];
    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return next(new AppError('FORBIDDEN', 403, 'Insufficient permissions'));
    }

    next();
  };
};

module.exports = requireRole;
