// middleware/codingRateLimiter.js
const rateLimit = require('express-rate-limit');

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,              // 1 refresh per platform per student per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.params.studentId}:${req.params.platform}`,
  message: {
    success: false,
    data: null,
    error: { message: 'Please wait before refreshing this platform again.', code: 'RATE_LIMITED' }
  }
});

module.exports = { refreshLimiter };
