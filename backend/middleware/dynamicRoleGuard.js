/**
 * Dynamic Role Guard Middleware
 * Checks the role_assignments collection for dynamic roles: mentor, cc, rep.
 * These roles are NOT in the JWT — they are fetched at request time.
 * Attaches the matching role assignment to req.roleAssignment for downstream use.
 */

const RoleAssignment = require('../models/RoleAssignment');

const requireDynamicRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const assignment = await RoleAssignment.findOne({
        user_id: req.user.userId,
        role: { $in: roles },
        revoked_at: null
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: 'Access denied — dynamic role not assigned', code: 'ROLE_NOT_ASSIGNED' }
        });
      }

      req.roleAssignment = assignment; // attach scope info for downstream use
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Check if user has a specific dynamic role with a specific scope.
 * More granular than requireDynamicRole — checks scope_id too.
 */
const requireDynamicRoleWithScope = (role, scopeParam = 'scopeId') => {
  return async (req, res, next) => {
    try {
      const scopeId = req.params[scopeParam];

      const assignment = await RoleAssignment.findOne({
        user_id: req.user.userId,
        role,
        scope_id: scopeId,
        revoked_at: null
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          data: null,
          error: { message: `Access denied — no active ${role} role for this scope`, code: 'SCOPE_MISMATCH' }
        });
      }

      req.roleAssignment = assignment;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { requireDynamicRole, requireDynamicRoleWithScope };
