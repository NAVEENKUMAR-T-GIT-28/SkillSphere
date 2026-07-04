/**
 * Search Routes
 * GET /api/search/students — Search students with filters
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { trackRouter } = require('../utils/routeTracker');
const controller = require('../controllers/searchController');

const router = trackRouter(express.Router(), '/api/search');

router.get(
  '/students',
  authenticate,
  requireRole('faculty', 'hod'),
  controller.searchStudents
);

module.exports = router;
