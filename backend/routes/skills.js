/**
 * Skills Routes
 * GET    /api/skill-taxonomy               — List all active skills (public, for picker)
 * GET    /api/students/:studentId/skills    — List student's skills
 * POST   /api/students/:studentId/skills    — Add skill from taxonomy
 * DELETE /api/students/:studentId/skills/:skillId — Remove skill
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const SkillTaxonomy = require('../models/SkillTaxonomy');
const VerificationLog = require('../models/VerificationLog');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { success, error } = require('../utils/response');
const { sanitizeField } = require('../utils/sanitize');

const router = express.Router();

/**
 * GET /api/skill-taxonomy
 * List all active skills for the skill picker dropdown. Public endpoint.
 */
router.get('/skill-taxonomy', async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { is_active: true };
    if (category) filter.category = category;

    const skills = await SkillTaxonomy.find(filter).sort({ category: 1, name: 1 });

    success(res, skills, { total: skills.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/students/:studentId/skills
 * List all skills for a student. Owner, faculty, or HOD can access.
 */
router.get(
  '/students/:studentId/skills',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  async (req, res, next) => {
    try {
      const { status } = req.query;
      const filter = { student_id: req.params.studentId };
      if (status) filter.status = status;

      const skills = await Skill.find(filter)
        .populate('taxonomy_id', 'category is_trending')
        .populate('verified_by', 'email')
        .sort({ created_at: -1 });

      success(res, skills, { total: skills.length });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/students/:studentId/skills
 * Add a new skill from taxonomy. Student can only add to their own profile.
 */
router.post(
  '/students/:studentId/skills',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('taxonomy_id').isMongoId().withMessage('Valid taxonomy ID is required'),
    body('proficiency')
      .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
      .withMessage('Proficiency must be beginner, intermediate, advanced, or expert'),
    body('evidence_note').optional().trim().customSanitizer(sanitizeField)
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const { taxonomy_id, proficiency, evidence_note } = req.body;

      // Validate taxonomy exists and is active
      const taxonomy = await SkillTaxonomy.findById(taxonomy_id);
      if (!taxonomy || !taxonomy.is_active) {
        return error(res, 'Skill not found in taxonomy or is inactive', 404, 'SKILL_NOT_FOUND');
      }

      // Evidence required for advanced/expert
      if (['advanced', 'expert'].includes(proficiency) && !evidence_note) {
        return error(res, 'Evidence note is required for advanced or expert proficiency', 400, 'EVIDENCE_REQUIRED');
      }

      // Check for duplicate
      const existing = await Skill.findOne({
        student_id: req.params.studentId,
        taxonomy_id
      });
      if (existing) {
        return error(res, 'You already have this skill added', 409, 'DUPLICATE_SKILL');
      }

      // Create skill
      const skill = await Skill.create({
        student_id: req.params.studentId,
        taxonomy_id,
        skill_name: taxonomy.name, // denormalized copy
        proficiency,
        evidence_note,
        status: 'pending'
      });

      // Log submission
      await VerificationLog.create({
        item_type: 'skill',
        item_id: skill._id,
        student_id: req.params.studentId,
        actor_id: req.user.userId,
        action: 'submitted',
        comment: `Skill "${taxonomy.name}" submitted at ${proficiency} level`
      });

      success(res, skill, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/students/:studentId/skills/:skillId
 * Remove a skill. Only owner or HOD can delete. Cannot delete verified skills.
 */
router.delete(
  '/students/:studentId/skills/:skillId',
  authenticate,
  requireOwnerOrRole('hod'),
  async (req, res, next) => {
    try {
      const skill = await Skill.findOne({
        _id: req.params.skillId,
        student_id: req.params.studentId
      });

      if (!skill) {
        return error(res, 'Skill not found', 404, 'NOT_FOUND');
      }

      if (skill.status === 'verified') {
        return error(res, 'Cannot delete a verified skill. Contact faculty to revoke.', 400, 'CANNOT_DELETE_VERIFIED');
      }

      await Skill.findByIdAndDelete(req.params.skillId);

      success(res, { message: 'Skill removed successfully' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
