/**
 * Internships Routes
 * GET    /api/students/:studentId/internships                   — List student's internships
 * POST   /api/students/:studentId/internships                   — Add internship
 * PATCH  /api/students/:studentId/internships/:internshipId     — Update internship
 * DELETE /api/students/:studentId/internships/:internshipId     — Delete internship
 */

const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { sanitizeField } = require('../utils/sanitize');
const internshipController = require('../controllers/internshipController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

router.get('/:studentId/internships', authenticate, requireOwnerOrRole('faculty', 'hod'), internshipController.getInternships);

router.post(
  '/:studentId/internships',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('company').notEmpty().trim().withMessage('Company name is required').customSanitizer(sanitizeField),
    body('role').notEmpty().trim().withMessage('Role/title is required').customSanitizer(sanitizeField),
    body('start_date').isISO8601().withMessage('Valid start date is required'),
    body('end_date').optional({ nullable: true }).isISO8601().withMessage('Invalid end date'),
    body('duration_months').optional().isFloat({ min: 0 }).withMessage('Duration must be a non-negative number'),
    body('stipend').optional().isFloat({ min: 0 }).withMessage('Stipend must be a non-negative number'),
    body('certificate_url').optional().trim(),
    body('offer_letter_url').optional().trim()
  ],
  internshipController.addInternship
);

router.patch('/:studentId/internships/:internshipId', authenticate, requireOwnerOrRole('hod'), internshipController.updateInternship);

router.delete('/:studentId/internships/:internshipId', authenticate, requireOwnerOrRole('hod'), internshipController.deleteInternship);

module.exports = router;
