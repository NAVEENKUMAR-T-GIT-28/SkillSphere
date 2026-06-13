/**
 * Ownership Guard Middleware
 * Ensures a student can only access their own data.
 * HOD and other allowed roles bypass the ownership check.
 * Attaches the student document to req.student for downstream use.
 */

const Student = require('../models/Student');

const requireOwnerOrRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // HOD or other allowed base roles bypass ownership check
      if (allowedRoles.includes(req.user.baseRole)) {
        return next();
      }

      // Student can only access their own data
      const student = await Student.findOne({ user_id: req.user.userId });

      if (!student) {
        if (req.user.baseRole !== 'student') {
          return res.status(403).json({
            success: false,
            data: null,
            error: { message: 'Access denied — insufficient role', code: 'INSUFFICIENT_ROLE' }
          });
        }
        return res.status(404).json({
          success: false,
          data: null,
          error: { message: 'Student profile not found', code: 'PROFILE_NOT_FOUND' }
        });
      }

      if (student._id.toString() !== req.params.studentId) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: 'Access denied — not your resource', code: 'NOT_OWNER' }
        });
      }

      req.student = student; // attach for downstream use
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { requireOwnerOrRole };
