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
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { sanitizeField } = require('../utils/sanitize');
const placementController = require('../controllers/placementController');

const router = express.Router();

router.get('/placement-drives', authenticate, placementController.getAllDrives);

router.post(
  '/placement-drives',
  authenticate,
  requireRole('hod'),
  [
    body('company_name').notEmpty().trim().withMessage('Company name is required').customSanitizer(sanitizeField),
    body('role_title').notEmpty().trim().withMessage('Role title is required').customSanitizer(sanitizeField),
    body('drive_date').isISO8601().withMessage('Valid drive date is required'),
    body('application_deadline').isISO8601().withMessage('Valid application deadline is required'),
    body('drive_type').isIn(['oncampus', 'offcampus', 'internship']).withMessage('Drive type must be oncampus, offcampus, or internship'),
    body('eligibility').optional().isObject()
  ],
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
  [
    body('status').isIn(['shortlisted', 'round1', 'round2', 'selected', 'rejected']).withMessage('Invalid status'),
    body('notes').optional().trim().customSanitizer(sanitizeField)
  ],
  placementController.updateApplicationStatus
);

module.exports = router;
