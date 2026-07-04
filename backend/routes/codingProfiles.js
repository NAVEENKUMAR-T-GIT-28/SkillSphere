/**
 * Coding Profiles Routes
 * GET    /api/students/:studentId/coding-profiles              — List student's coding profiles
 * POST   /api/students/:studentId/coding-profiles              — Add coding profile
 * PATCH  /api/students/:studentId/coding-profiles/:profileId   — Update coding profile stats
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { trackRouter } = require('../utils/routeTracker');
const { addCodingProfileValidator } = require('../validators/codingProfile.validator');
const controller = require('../controllers/codingProfileController');

const router = trackRouter(express.Router(), '/api/students');

router.get(
  '/:studentId/coding-profiles',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  controller.listCodingProfiles
);

router.post(
  '/:studentId/coding-profiles',
  authenticate,
  requireOwnerOrRole('hod'),
  addCodingProfileValidator,
  controller.addCodingProfile
);

router.patch(
  '/:studentId/coding-profiles/:profileId',
  authenticate,
  requireOwnerOrRole('hod'),
  controller.updateCodingProfile
);

router.delete(
  '/:studentId/coding-profiles/:profileId',
  authenticate,
  requireOwnerOrRole('hod'),
  controller.deleteCodingProfile
);

module.exports = router;
