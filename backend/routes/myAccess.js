const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { trackRouter } = require('../utils/routeTracker');
const controller = require('../controllers/myAccessController');
const dashboardController = require('../controllers/dashboardController');

const router = trackRouter(express.Router(), '/api/my');

// GET /api/my/mentees  — faculty: list students they mentor
router.get('/mentees', authenticate, requireRole('faculty', 'hod'), controller.getMentees);

// GET /api/my/class  — CC or rep: list students in their class/section
router.get('/class', authenticate, requireRole('faculty', 'student', 'hod'), controller.getClassAccess);

// GET /api/my/dashboard — student: dashboard aggregator
router.get('/dashboard', authenticate, requireRole('student'), dashboardController.getDashboard);

module.exports = router;
