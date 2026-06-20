/**
 * Coding Profile Routes
 * GET    /api/students/:studentId/coding-profile                    — frontend-ready data, all platforms
 * POST   /api/students/:studentId/coding-profile/:platform/link     — link + fetch for the first time
 * POST   /api/students/:studentId/coding-profile/:platform/refresh  — re-fetch (rate-limited)
 * DELETE /api/students/:studentId/coding-profile/:platform          — unlink
 */

const express = require('express');
const { body, param } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { refreshLimiter } = require('../middleware/codingRateLimiter');
const controller = require('../controllers/codingProfileController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

const platformParamCheck = param('platform').isIn(['leetcode', 'hackerrank', 'skillrack']).withMessage('Invalid platform');

router.get(
  '/:studentId/coding-profile',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  controller.getCodingProfile
);

router.post(
  '/:studentId/coding-profile/:platform/link',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    platformParamCheck,
    body('username').if(param('platform').isIn(['leetcode', 'hackerrank'])).notEmpty().withMessage('Username is required'),
    body('skillrack_id').if(param('platform').equals('skillrack')).notEmpty().withMessage('SkillRack id is required'),
    body('skillrack_key').if(param('platform').equals('skillrack')).notEmpty().withMessage('SkillRack key is required')
  ],
  controller.linkPlatform
);

router.post(
  '/:studentId/coding-profile/:platform/refresh',
  authenticate,
  requireOwnerOrRole('hod'),
  platformParamCheck,
  refreshLimiter,
  controller.refreshPlatform
);

router.patch(
  '/:studentId/coding-profile/links',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('leetcode').optional().isString(),
    body('hackerrank').optional().isString(),
    body('skillrack').optional().isString()
  ],
  controller.updatePlatformLinks
);

router.delete(
  '/:studentId/coding-profile/:platform',
  authenticate,
  requireOwnerOrRole('hod'),
  platformParamCheck,
  controller.unlinkPlatform
);

module.exports = router;
