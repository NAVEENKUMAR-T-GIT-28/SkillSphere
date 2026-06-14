/**
 * Resumes Routes
 * GET    /api/students/:studentId/resumes   — List student's resumes
 * POST   /api/students/:studentId/resumes   — Add resume version
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Resume = require('../models/Resume');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { success, error } = require('../utils/response');
const { driveLink } = require('../utils/validators');
const { sanitizeField } = require('../utils/sanitize');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

/**
 * GET /api/students/:studentId/resumes
 * List all resume versions for a student.
 */
router.get(
  '/:studentId/resumes',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  async (req, res, next) => {
    try {
      const resumes = await Resume.find({ student_id: req.params.studentId })
        .sort({ version: -1 });

      success(res, resumes, { total: resumes.length });
    } catch (err) {
      next(err);
    }
  }
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
  [
    driveLink('drive_link'),
    body('label').optional().trim().customSanitizer(sanitizeField)
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      // Get next version number
      const latestResume = await Resume.findOne({ student_id: req.params.studentId })
        .sort({ version: -1 });
      const nextVersion = latestResume ? latestResume.version + 1 : 1;

      // Set all previous resumes to not latest
      await Resume.updateMany(
        { student_id: req.params.studentId, is_latest: true },
        { is_latest: false }
      );

      // Create new resume
      const resume = await Resume.create({
        student_id: req.params.studentId,
        version: nextVersion,
        drive_link: req.body.drive_link,
        label: req.body.label,
        is_latest: true
      });

      success(res, resume, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/students/:studentId/resumes/:resumeId
 * Delete a resume version.
 */
router.delete(
  '/:studentId/resumes/:resumeId',
  authenticate,
  requireOwnerOrRole('hod'),
  async (req, res, next) => {
    try {
      const resume = await Resume.findOne({
        _id: req.params.resumeId,
        student_id: req.params.studentId
      });

      if (!resume) {
        return error(res, 'Resume not found', 404, 'NOT_FOUND');
      }

      await Resume.findByIdAndDelete(req.params.resumeId);

      // If it was the latest, we should probably set the next most recent to latest
      if (resume.is_latest) {
        const nextLatest = await Resume.findOne({ student_id: req.params.studentId })
          .sort({ version: -1 });
        if (nextLatest) {
          nextLatest.is_latest = true;
          await nextLatest.save();
        }
      }

      success(res, { message: 'Resume deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
