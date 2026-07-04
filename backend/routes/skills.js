/**
 * Skills Routes
 * GET    /api/skill-taxonomy               — List all active skills
 * GET    /api/students/:studentId/skills    — List student's skills
 * POST   /api/students/:studentId/skills    — Add skill from taxonomy
 * DELETE /api/students/:studentId/skills/:skillId — Remove skill
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const skillController = require('../controllers/skillController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api');

router.get('/skill-taxonomy', skillController.getAllTaxonomy);

router.get('/students/:studentId/skills', authenticate, requireOwnerOrRole('faculty', 'hod'), skillController.getSkills);

const { addSkillValidator } = require('../validators/skill.validator');

router.post(
  '/students/:studentId/skills',
  authenticate,
  requireOwnerOrRole('hod'),
  addSkillValidator,
  skillController.addSkill
);

router.delete('/students/:studentId/skills/:skillId', authenticate, requireOwnerOrRole('hod'), skillController.deleteSkill);

module.exports = router;
