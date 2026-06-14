/**
 * Student Routes
 * GET    /api/students/dashboard          — Get student dashboard
 * GET    /api/students/:studentId/profile — Get student profile
 * PATCH  /api/students/:studentId/profile — Update student profile
 * GET    /api/students/:studentId/score   — Get readiness score breakdown
 * GET    /api/students/:studentId/applications — Get applications
 */

const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { sanitizeField } = require('../utils/sanitize');
const studentController = require('../controllers/studentController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

router.get('/dashboard', authenticate, studentController.getDashboard);

router.get('/:studentId/profile', authenticate, requireOwnerOrRole('faculty', 'hod'), studentController.getProfile);

router.patch(
  '/:studentId/profile',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty').customSanitizer(sanitizeField),
    body('phone').optional().trim(),
    body('profile_photo_url').optional().trim(),
    body('career_objective').optional().trim().isLength({ max: 500 }).withMessage('Career objective max 500 chars').customSanitizer(sanitizeField),
    body('department').optional().trim(),
    body('section').optional().trim(),
    body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be 1-8'),
    body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be 0-10'),
    body('links').optional().isObject().withMessage('Links must be an object')
  ],
  studentController.updateProfile
);

router.get('/:studentId/applications', authenticate, requireOwnerOrRole('faculty', 'hod'), studentController.getApplications);

router.get('/:studentId/score', authenticate, requireOwnerOrRole('faculty', 'hod'), studentController.getReadinessScore);

module.exports = router;
