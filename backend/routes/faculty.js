/**
 * Faculty / Verification Routes
 * GET    /api/verification/queue                    — Get pending verification items
 * POST   /api/verification/:type/:itemId/approve    — Approve an item
 * POST   /api/verification/:type/:itemId/reject     — Reject an item
 */

const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { sanitizeField } = require('../utils/sanitize');
const facultyController = require('../controllers/facultyController');

const router = express.Router();

router.get('/queue', authenticate, requireRole('faculty', 'hod'), facultyController.getVerificationQueue);

router.post(
  '/:type/:itemId/approve',
  authenticate,
  requireRole('faculty', 'hod'),
  [
    body('comment').optional().trim().customSanitizer(sanitizeField)
  ],
  facultyController.approveItem
);

router.post(
  '/:type/:itemId/reject',
  authenticate,
  requireRole('faculty', 'hod'),
  [
    body('reason').notEmpty().trim().withMessage('Rejection reason is required').customSanitizer(sanitizeField),
    body('comment').optional().trim().customSanitizer(sanitizeField)
  ],
  facultyController.rejectItem
);

module.exports = router;
