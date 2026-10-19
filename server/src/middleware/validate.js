const AppError = require('../utils/AppError');

/**
 * Joi validation middleware factory.
 * Validates req.body, req.query, or req.params against a Joi schema.
 * Rejects unknown fields.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: false,
      allowUnknown: false,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(new AppError('VALIDATION_ERROR', 400, 'Validation failed', details));
    }

    // Replace with validated (and potentially coerced) value
    req[source] = value;
    next();
  };
};

module.exports = validate;
