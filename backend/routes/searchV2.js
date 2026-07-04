/**
 * Search V2 Routes
 * GET /api/search/v2/students — Search students from StudentSearch (denormalized)
 *
 * This is an ADDITIVE endpoint. The original /api/search/students is unchanged
 * and remains the production endpoint used by the frontend.
 * This V2 endpoint reads from the StudentSearch collection for validation
 * and performance comparison. It will NOT replace the original until
 * explicitly approved in a future change.
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { trackRouter } = require('../utils/routeTracker');
const controller = require('../controllers/searchController');

const router = trackRouter(express.Router(), '/api/search/v2');

router.get(
  '/students',
  authenticate,
  requireRole('faculty', 'hod'),
  controller.searchStudentsV2
);

module.exports = router;
