/**
 * Base Role Guard Middleware
 * Checks the permanent base_role from JWT payload.
 * Use for routes restricted to specific base roles (student, faculty, hod, admin).
 */

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Authentication required', code: 'NOT_AUTHENTICATED' }
      });
    }

    if (!roles.includes(req.user.baseRole)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: { message: 'Access denied — insufficient role', code: 'INSUFFICIENT_ROLE' }
      });
    }

    next();
  };
};

module.exports = { requireRole };
