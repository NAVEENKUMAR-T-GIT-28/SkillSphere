/**
 * Coding Profiles Routes
 * GET    /api/students/:studentId/coding-profiles              — List student's coding profiles
 * POST   /api/students/:studentId/coding-profiles              — Add coding profile
 * PATCH  /api/students/:studentId/coding-profiles/:profileId   — Update coding profile stats
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const CodingProfile = require('../models/CodingProfile');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { recalculateScore } = require('../services/readinessScore');
const { success, error } = require('../utils/response');
const { httpsUrl } = require('../utils/validators');

const router = express.Router();

/**
 * GET /api/students/:studentId/coding-profiles
 * List all coding profiles for a student.
 */
router.get(
  '/:studentId/coding-profiles',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  async (req, res, next) => {
    try {
      const profiles = await CodingProfile.find({ student_id: req.params.studentId })
        .sort({ platform: 1 });

      success(res, profiles, { total: profiles.length });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/students/:studentId/coding-profiles
 * Add a coding profile for a platform.
 */
router.post(
  '/:studentId/coding-profiles',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('platform')
      .isIn(['leetcode', 'hackerrank', 'codechef', 'skillrack', 'github', 'codeforces'])
      .withMessage('Invalid platform'),
    body('username').notEmpty().trim().withMessage('Username is required'),
    httpsUrl('profile_url'),
    body('problems_solved').optional().isInt({ min: 0 }).withMessage('Problems solved must be >= 0'),
    body('contest_rating').optional().isInt({ min: 0 }).withMessage('Contest rating must be >= 0'),
    body('badges').optional().isArray()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      // Check for duplicate platform
      const existing = await CodingProfile.findOne({
        student_id: req.params.studentId,
        platform: req.body.platform
      });
      if (existing) {
        return error(res, `You already have a ${req.body.platform} profile added`, 409, 'DUPLICATE_PLATFORM');
      }

      const profile = await CodingProfile.create({
        student_id: req.params.studentId,
        ...req.body,
        last_updated: new Date()
      });

      // Recalculate score since coding stats affect it
      await recalculateScore(req.params.studentId);

      success(res, profile, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/students/:studentId/coding-profiles/:profileId
 * Update coding profile stats (problems solved, rating, badges).
 */
router.patch(
  '/:studentId/coding-profiles/:profileId',
  authenticate,
  requireOwnerOrRole('hod'),
  async (req, res, next) => {
    try {
      const profile = await CodingProfile.findOne({
        _id: req.params.profileId,
        student_id: req.params.studentId
      });

      if (!profile) {
        return error(res, 'Coding profile not found', 404, 'NOT_FOUND');
      }

      const allowedFields = ['username', 'profile_url', 'problems_solved', 'contest_rating', 'badges'];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          profile[field] = req.body[field];
        }
      }

      profile.last_updated = new Date();
      await profile.save();

      // Recalculate score
      await recalculateScore(req.params.studentId);

      success(res, profile);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/students/:studentId/coding-profiles/:profileId
 * Delete a coding profile.
 */
router.delete(
  '/:studentId/coding-profiles/:profileId',
  authenticate,
  requireOwnerOrRole('hod'),
  async (req, res, next) => {
    try {
      const profile = await CodingProfile.findOne({
        _id: req.params.profileId,
        student_id: req.params.studentId
      });

      if (!profile) {
        return error(res, 'Coding profile not found', 404, 'NOT_FOUND');
      }

      await CodingProfile.findByIdAndDelete(req.params.profileId);
      
      // Recalculate score
      await recalculateScore(req.params.studentId);

      success(res, { message: 'Coding profile deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
