/**
 * Resumes Routes
 * GET    /api/students/:studentId/resumes   — List student's resumes
 * POST   /api/students/:studentId/resumes   — Add resume version
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const resumeController = require('../controllers/resumeController');
const { trackRouter } = require('../utils/routeTracker');

const router = trackRouter(express.Router(), '/api/students');

/**
 * GET /api/students/:studentId/resumes
 * List all resume versions for a student.
 */
const { addResumeValidator } = require('../validators/resume.validator');

/**
 * GET /api/students/:studentId/resumes
 * List all resume versions for a student.
 */
router.get(
  '/:studentId/resumes',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  resumeController.getResumes
);

/**
 * POST /api/students/:studentId/resumes
 * Add a new resume version. Auto-increments version number.
 * Toggles is_latest: previous latest is set to false.
 */
router.post(
  '/:studentId/resumes',
  authenticate,
  requireOwnerOrRole('hod'),
  addResumeValidator,
  resumeController.addResume
);

/**
 * DELETE /api/students/:studentId/resumes/:resumeId
 * Delete a resume version.
 */
router.delete(
  '/:studentId/resumes/:resumeId',
  authenticate,
  requireOwnerOrRole('hod'),
  resumeController.deleteResume
);

module.exports = router;
