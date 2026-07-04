/**
 * Coding Profile Routes
 * GET    /api/students/:studentId/coding-profile                    — frontend-ready data, all platforms
 * POST   /api/students/:studentId/coding-profile/:platform/link     — link + fetch for the first time
 * POST   /api/students/:studentId/coding-profile/:platform/refresh  — re-fetch (rate-limited)
 * DELETE /api/students/:studentId/coding-profile/:platform          — unlink
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { refreshLimiter } = require('../middleware/codingRateLimiter');
const controller = require('../controllers/codingProfileController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

router.get(
  '/:studentId/coding-profile',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  controller.getCodingProfile
);

const {
  linkPlatformValidator,
  refreshPlatformValidator,
  updatePlatformLinksValidator,
  unlinkPlatformValidator
} = require('../validators/codingProfile.validator');

router.post(
  '/:studentId/coding-profile/:platform/link',
  authenticate,
  requireOwnerOrRole('hod'),
  linkPlatformValidator,
  controller.linkPlatform
);

router.post(
  '/:studentId/coding-profile/:platform/refresh',
  authenticate,
  requireOwnerOrRole('hod'),
  refreshPlatformValidator,
  refreshLimiter,
  controller.refreshPlatform
);

router.patch(
  '/:studentId/coding-profile/links',
  authenticate,
  requireOwnerOrRole('hod'),
  updatePlatformLinksValidator,
  controller.updatePlatformLinks
);

router.delete(
  '/:studentId/coding-profile/:platform',
  authenticate,
  requireOwnerOrRole('hod'),
  unlinkPlatformValidator,
  controller.unlinkPlatform
);

module.exports = router;
