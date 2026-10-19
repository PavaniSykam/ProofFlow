const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const config = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// NoSQL operator injection sanitization
app.use(mongoSanitize());

// HTTP request logger
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Custom header check for state-mutating requests (CSRF mitigation)
app.use((req, res, next) => {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (config.nodeEnv !== 'test' && mutatingMethods.includes(req.method) && req.path.startsWith('/api')) {
    const hasToken = req.cookies?.token;
    const hasCustomHeader = req.headers['x-requested-with'];
    const isJsonOrMultipart =
      req.is('application/json') || req.is('multipart/form-data');

    if (hasToken && !hasCustomHeader && !isJsonOrMultipart && req.body && Object.keys(req.body).length > 0) {
      return next(new AppError('CSRF_ERROR', 403, 'Invalid request origin or headers'));
    }
  }
  next();
});

// Mount API router
app.use('/api', apiRoutes);

// Catch-all 404 handler for unknown routes
app.use((req, res, next) => {
  next(new AppError('NOT_FOUND', 404, `Cannot ${req.method} ${req.originalUrl}`));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
