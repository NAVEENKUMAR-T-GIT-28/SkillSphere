/**
 * Projects Routes
 * GET    /api/students/:studentId/projects              — List student's projects
 * POST   /api/students/:studentId/projects              — Add a project
 * PATCH  /api/students/:studentId/projects/:projectId   — Update project
 * DELETE /api/students/:studentId/projects/:projectId   — Delete project
 * POST   /api/students/:studentId/projects/:projectId/rate — Rate a project (Faculty only)
 */

const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { requireRole } = require('../middleware/roleGuard');
const { driveLink } = require('../utils/validators');
const { sanitizeField } = require('../utils/sanitize');
const projectController = require('../controllers/projectController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api');

router.get('/students/:studentId/projects', authenticate, requireOwnerOrRole('faculty', 'hod'), projectController.getProjects);

router.post(
  '/students/:studentId/projects',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('title').notEmpty().trim().withMessage('Project title is required').customSanitizer(sanitizeField),
    body('description').optional().trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters').customSanitizer(sanitizeField),
    body('tech_stack').isArray({ min: 1 }).withMessage('At least one technology must be specified'),
    body('tech_stack.*').trim().notEmpty(),
    body('github_url').notEmpty().isURL().withMessage('Must be a valid URL'),
    body('live_demo_url').optional().isURL().withMessage('Must be a valid URL'),
    body('complexity_tier').isIn(['basic', 'intermediate', 'advanced']).withMessage('Invalid complexity tier'),
    body('student_ids').optional().isArray().withMessage('student_ids must be an array of ObjectIds')
  ],
  projectController.addProject
);

router.patch('/students/:studentId/projects/:projectId', authenticate, requireOwnerOrRole('hod'), projectController.updateProject);

router.delete('/students/:studentId/projects/:projectId', authenticate, requireOwnerOrRole('hod'), projectController.deleteProject);

router.post(
  '/projects/:projectId/rate',
  authenticate,
  requireRole('faculty', 'hod'),
  [
    body('functionality').isInt({ min: 1, max: 5 }),
    body('code_quality').isInt({ min: 1, max: 5 }),
    body('documentation').isInt({ min: 1, max: 5 }),
    body('innovation').isInt({ min: 1, max: 5 }),
    body('complexity').isInt({ min: 1, max: 5 }),
    body('feedback').optional().trim().customSanitizer(sanitizeField)
  ],
  projectController.rateProject
);

module.exports = router;
