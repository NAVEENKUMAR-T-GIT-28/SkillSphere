/**
 * Placement Routes
 * GET    /api/placement-drives                      — List drives
 * POST   /api/placement-drives                      — Create drive (HOD only)
 * GET    /api/placement-drives/:id                   — Get drive details
 * GET    /api/placement-drives/:id/shortlist         — Get eligible/shortlisted students
 * POST   /api/placement-drives/:id/apply             — Student applies
 * PATCH  /api/applications/:id/status                — Update application status
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const placementController = require('../controllers/placementController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api');

router.get('/placement-drives', authenticate, placementController.getAllDrives);

const { createDriveValidator, updateApplicationStatusValidator } = require('../validators/placement.validator');

router.post(
  '/placement-drives',
  authenticate,
  requireRole('hod'),
  createDriveValidator,
  placementController.createDrive
);

router.get('/placement-drives/:id', authenticate, placementController.getDriveById);

router.delete('/placement-drives/:id', authenticate, requireRole('hod'), placementController.deleteDrive);

router.get('/placement-drives/:id/shortlist', authenticate, requireRole('faculty', 'hod'), placementController.getDriveShortlist);

router.post('/placement-drives/:id/apply', authenticate, requireRole('student'), placementController.applyToDrive);

router.patch(
  '/applications/:id/status',
  authenticate,
  requireRole('faculty', 'hod'),
  updateApplicationStatusValidator,
  placementController.updateApplicationStatus
);

module.exports = router;
