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
const { createRoleAssignmentValidator, updateClassSemesterValidator } = require('../validators/hod.validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const hodController = require('../controllers/hodController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/hod');

router.get('/dashboard', authenticate, requireRole('hod'), hodController.getDashboard);

router.get('/students', authenticate, requireRole('hod'), hodController.getAllStudents);

router.post(
  '/role-assignments',
  authenticate,
  requireRole('hod'),
  createRoleAssignmentValidator,
  hodController.createRoleAssignment
);

router.get('/role-assignments', authenticate, requireRole('hod'), hodController.getRoleAssignments);

router.delete('/role-assignments/:id', authenticate, requireRole('hod'), hodController.revokeRoleAssignment);

router.get('/verification-logs', authenticate, requireRole('hod'), hodController.getVerificationLogs);

router.get('/users', authenticate, requireRole('hod'), hodController.searchUsers);

router.get('/classes', authenticate, requireRole('hod'), hodController.getClasses);

router.patch(
  '/classes/:classId/semester',
  authenticate,
  requireRole('hod'),
  updateClassSemesterValidator,
  hodController.updateClassSemester
);

module.exports = router;
