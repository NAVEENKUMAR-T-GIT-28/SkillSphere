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
const enrollmentController = require('../controllers/enrollmentController');
const enrollmentValidator = require('../validators/enrollmentValidator');
const { createStudentLimiter, passwordResetLimiter } = require('../middleware/enrollmentRateLimiter');
const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/hod');

router.get('/dashboard', authenticate, requireRole('hod'), hodController.getDashboard);

router.post('/students', authenticate, requireRole('hod'), createStudentLimiter, enrollmentValidator.validateCreateStudent, enrollmentController.createStudent);
router.get('/students', authenticate, requireRole('hod'), enrollmentController.getStudents);
router.get('/students/:id', authenticate, requireRole('hod'), enrollmentController.getStudentById);
router.patch('/students/:id', authenticate, requireRole('hod'), enrollmentValidator.validateUpdateStudent, enrollmentController.updateStudent);
router.patch('/students/:id/class', authenticate, requireRole('hod'), enrollmentValidator.validateChangeClass, enrollmentController.changeClass);
router.patch('/students/:id/password-reset', authenticate, requireRole('hod'), passwordResetLimiter, enrollmentController.resetPassword);
router.patch('/students/:id/status', authenticate, requireRole('hod'), enrollmentValidator.validateChangeStatus, enrollmentController.changeStatus);

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
router.post('/classes', authenticate, requireRole('hod'), hodController.createClass);
router.put('/classes/:classId', authenticate, requireRole('hod'), hodController.updateClass);
router.patch('/classes/:classId/status', authenticate, requireRole('hod'), hodController.changeClassStatus);
router.patch('/classes/:classId/promote', authenticate, requireRole('hod'), hodController.promoteClass);

module.exports = router;
