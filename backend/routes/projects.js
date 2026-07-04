/**
 * Projects Routes
 * GET    /api/students/:studentId/projects              — List student's projects
 * POST   /api/students/:studentId/projects              — Add a project
 * PATCH  /api/students/:studentId/projects/:projectId   — Update project
 * DELETE /api/students/:studentId/projects/:projectId   — Delete project
 * POST   /api/students/:studentId/projects/:projectId/rate — Rate a project (Faculty only)
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { requireRole } = require('../middleware/roleGuard');
const projectController = require('../controllers/projectController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api');

router.get('/students/:studentId/projects', authenticate, requireOwnerOrRole('faculty', 'hod'), projectController.getProjects);

const { addProjectValidator, rateProjectValidator } = require('../validators/project.validator');

router.post(
  '/students/:studentId/projects',
  authenticate,
  requireOwnerOrRole('hod'),
  addProjectValidator,
  projectController.addProject
);

router.patch('/students/:studentId/projects/:projectId', authenticate, requireOwnerOrRole('hod'), projectController.updateProject);

router.delete('/students/:studentId/projects/:projectId', authenticate, requireOwnerOrRole('hod'), projectController.deleteProject);

router.post(
  '/projects/:projectId/rate',
  authenticate,
  requireRole('faculty', 'hod'),
  rateProjectValidator,
  projectController.rateProject
);

module.exports = router;
