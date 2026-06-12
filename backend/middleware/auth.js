/**
 * JWT Authentication Middleware
 * Verifies the Bearer token from the Authorization header.
 * Attaches decoded payload { userId, baseRole } to req.user.
 */

const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      error: { message: 'No token provided', code: 'NO_TOKEN' }
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, baseRole, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Token has expired', code: 'TOKEN_EXPIRED' }
      });
    }
    return res.status(401).json({
      success: false,
      data: null,
      error: { message: 'Invalid token', code: 'INVALID_TOKEN' }
    });
  }
};

module.exports = { authenticate };
