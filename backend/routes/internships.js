/**
 * Internships Routes
 * GET    /api/students/:studentId/internships                   — List student's internships
 * POST   /api/students/:studentId/internships                   — Add internship
 * PATCH  /api/students/:studentId/internships/:internshipId     — Update internship
 * DELETE /api/students/:studentId/internships/:internshipId     — Delete internship
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const internshipController = require('../controllers/internshipController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

router.get('/:studentId/internships', authenticate, requireOwnerOrRole('faculty', 'hod'), internshipController.getInternships);

const { addInternshipValidator } = require('../validators/internship.validator');

router.post(
  '/:studentId/internships',
  authenticate,
  requireOwnerOrRole('hod'),
  addInternshipValidator,
  internshipController.addInternship
);

router.patch('/:studentId/internships/:internshipId', authenticate, requireOwnerOrRole('hod'), internshipController.updateInternship);

router.delete('/:studentId/internships/:internshipId', authenticate, requireOwnerOrRole('hod'), internshipController.deleteInternship);

module.exports = router;
