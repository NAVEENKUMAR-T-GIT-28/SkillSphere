/**
 * Achievements Routes
 * GET    /api/students/:studentId/achievements                     — List student's achievements
 * POST   /api/students/:studentId/achievements                     — Add achievement
 * PATCH  /api/students/:studentId/achievements/:achievementId      — Update achievement
 * DELETE /api/students/:studentId/achievements/:achievementId      — Delete achievement
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const achievementController = require('../controllers/achievementController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

router.get('/:studentId/achievements', authenticate, requireOwnerOrRole('faculty', 'hod'), achievementController.getAchievements);

const { addAchievementValidator } = require('../validators/achievement.validator');

router.post(
  '/:studentId/achievements',
  authenticate,
  requireOwnerOrRole('hod'),
  addAchievementValidator,
  achievementController.addAchievement
);

router.patch('/:studentId/achievements/:achievementId', authenticate, requireOwnerOrRole('hod'), achievementController.updateAchievement);

router.delete('/:studentId/achievements/:achievementId', authenticate, requireOwnerOrRole('hod'), achievementController.deleteAchievement);

module.exports = router;
