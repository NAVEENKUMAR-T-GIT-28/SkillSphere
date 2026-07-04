/**
 * Achievements Routes
 * GET    /api/students/:studentId/achievements                     — List student's achievements
 * POST   /api/students/:studentId/achievements                     — Add achievement
 * PATCH  /api/students/:studentId/achievements/:achievementId      — Update achievement
 * DELETE /api/students/:studentId/achievements/:achievementId      — Delete achievement
 */

const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { sanitizeField } = require('../utils/sanitize');
const achievementController = require('../controllers/achievementController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

router.get('/:studentId/achievements', authenticate, requireOwnerOrRole('faculty', 'hod'), achievementController.getAchievements);

router.post(
  '/:studentId/achievements',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('title').notEmpty().trim().withMessage('Title is required').customSanitizer(sanitizeField),
    body('category').isIn(['hackathon', 'paper', 'patent', 'award', 'sports', 'ncc', 'nss', 'volunteer', 'competition', 'club', 'other']).withMessage('Invalid achievement category'),
    body('custom_category').optional().trim().customSanitizer(sanitizeField),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description max 500 chars').customSanitizer(sanitizeField),
    body('certificate_url').optional().trim()
  ],
  achievementController.addAchievement
);

router.patch('/:studentId/achievements/:achievementId', authenticate, requireOwnerOrRole('hod'), achievementController.updateAchievement);

router.delete('/:studentId/achievements/:achievementId', authenticate, requireOwnerOrRole('hod'), achievementController.deleteAchievement);

module.exports = router;
