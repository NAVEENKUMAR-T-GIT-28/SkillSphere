/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns a consistent response.
 * Must be registered LAST in the middleware chain.
 */

const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return error(res, messages.join(', '), 400, 'VALIDATION_ERROR');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return error(res, `Duplicate value for field: ${field}`, 409, 'DUPLICATE_KEY');
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return error(res, `Invalid ${err.path}: ${err.value}`, 400, 'CAST_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token has expired', 401, 'TOKEN_EXPIRED');
  }

  // Default server error
  return error(res, err.message || 'Internal server error', err.statusCode || 500, err.code || 'SERVER_ERROR');
};

module.exports = { errorHandler };
