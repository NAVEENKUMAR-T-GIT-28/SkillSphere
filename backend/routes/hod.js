/**
 * HOD Routes
 * GET    /api/hod/dashboard              — Dashboard stats
 * GET    /api/hod/students               — All students with any filter
 * POST   /api/hod/role-assignments       — Assign dynamic role
 * DELETE /api/hod/role-assignments/:id   — Revoke dynamic role
 * GET    /api/hod/verification-logs      — Audit trail
 * GET    /api/hod/users                  — Search users
 * GET    /api/hod/classes                — Get classes
 */

const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const hodController = require('../controllers/hodController');

const router = express.Router();

router.get('/dashboard', authenticate, requireRole('hod'), hodController.getDashboard);

router.get('/students', authenticate, requireRole('hod'), hodController.getAllStudents);

router.post(
  '/role-assignments',
  authenticate,
  requireRole('hod'),
  [
    body('user_id').isMongoId().withMessage('Valid user ID is required'),
    body('role').isIn(['rep', 'mentor', 'cc']).withMessage('Role must be rep, mentor, or cc'),
    body('scope_type').isIn(['student', 'class', 'section']).withMessage('Invalid scope type'),
    body('scope_id').optional().isMongoId().withMessage('Valid scope ID required'),
    body('scope_label').notEmpty().trim().withMessage('Scope label is required'),
    body('scope_data').optional().isObject(),
    body('scope_data.department').optional().trim(),
    body('scope_data.section').optional().trim(),
    body('scope_data.batch_year').optional().isInt()
  ],
  hodController.createRoleAssignment
);

router.get('/role-assignments', authenticate, requireRole('hod'), hodController.getRoleAssignments);

router.delete('/role-assignments/:id', authenticate, requireRole('hod'), hodController.revokeRoleAssignment);

router.get('/verification-logs', authenticate, requireRole('hod'), hodController.getVerificationLogs);

router.get('/users', authenticate, requireRole('hod'), hodController.searchUsers);

router.get('/classes', authenticate, requireRole('hod'), hodController.getClasses);

module.exports = router;
