/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns a consistent response.
 * Must be registered LAST in the middleware chain.
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      data: null,
      error: { message: messages.join(', '), code: 'VALIDATION_ERROR' }
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      data: null,
      error: { message: `Duplicate value for field: ${field}`, code: 'DUPLICATE_KEY' }
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      data: null,
      error: { message: `Invalid ${err.path}: ${err.value}`, code: 'CAST_ERROR' }
    });
  }

  // JWT errors (in case middleware doesn't catch)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      data: null,
      error: { message: 'Invalid token', code: 'INVALID_TOKEN' }
    });
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    success: false,
    data: null,
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'SERVER_ERROR'
    }
  });
};

module.exports = { errorHandler };
