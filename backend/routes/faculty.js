/**
 * Faculty / Verification Routes
 * GET    /api/verification/queue                    — Get pending verification items
 * POST   /api/verification/:type/:itemId/approve    — Approve an item
 * POST   /api/verification/:type/:itemId/reject     — Reject an item
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const facultyController = require('../controllers/facultyController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/verification');

const { approveItemValidator, rejectItemValidator } = require('../validators/faculty.validator');

router.get('/queue', authenticate, requireRole('faculty', 'hod'), facultyController.getVerificationQueue);

router.post(
  '/:type/:itemId/approve',
  authenticate,
  requireRole('faculty', 'hod'),
  approveItemValidator,
  facultyController.approveItem
);

router.post(
  '/:type/:itemId/reject',
  authenticate,
  requireRole('faculty', 'hod'),
  rejectItemValidator,
  facultyController.rejectItem
);

module.exports = router;
