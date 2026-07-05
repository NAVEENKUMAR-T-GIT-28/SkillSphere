/**
 * Student Routes
 * GET    /api/students/dashboard          — Get student dashboard
 * GET    /api/students/:studentId/score   — Get readiness score breakdown
 * GET    /api/students/:studentId/applications — Get applications
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const studentController = require('../controllers/studentController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

router.get('/dashboard', authenticate, studentController.getDashboard);

router.get('/:studentId/applications', authenticate, requireOwnerOrRole('faculty', 'hod'), studentController.getApplications);

router.get('/:studentId/score', authenticate, requireOwnerOrRole('faculty', 'hod'), studentController.getReadinessScore);

module.exports = router;
