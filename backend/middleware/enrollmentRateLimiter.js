const rateLimit = require('express-rate-limit');

const createStudentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 creations per minute per IP (adjust as needed for bulk/admin)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: { message: 'Too many student creation requests, please try again later.', code: 'RATE_LIMITED' }
  }
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 password resets per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: { message: 'Too many password reset requests, please try again later.', code: 'RATE_LIMITED' }
  }
});

module.exports = {
  createStudentLimiter,
  passwordResetLimiter
};
