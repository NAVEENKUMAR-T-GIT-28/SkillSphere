// controllers/skillController.js
const { validationResult } = require('express-validator');
const skillRepo = require('../repositories/skillRepo');
const verificationLogRepo = require('../repositories/verificationLogRepo');
const { success, error } = require('../utils/response');

exports.getAllTaxonomy = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { is_active: true };
    if (category) filter.category = category;

    const skills = await skillRepo.findAllTaxonomy(filter);
    skills.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    success(res, skills, { total: skills.length });
  } catch (err) {
    next(err);
  }
};

exports.getSkills = async (req, res, next) => {
  try {
    const { status } = req.query;
    const skills = await skillRepo.findByStudentId(req.params.studentId);
    let filtered = skills;
    if (status) filtered = skills.filter(s => s.status === status);
    filtered.sort((a, b) => b.created_at - a.created_at);
    success(res, filtered, { total: filtered.length });
  } catch (err) {
    next(err);
  }
};

exports.addSkill = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const { taxonomy_id, proficiency, evidence_note, years_experience } = req.body;
    const taxonomy = await skillRepo.findTaxonomyById(taxonomy_id);
    if (!taxonomy || !taxonomy.is_active) {
      return error(res, 'Skill not found in taxonomy or is inactive', 404, 'SKILL_NOT_FOUND');
    }

    if (['advanced', 'expert'].includes(proficiency) && !evidence_note) {
      return error(res, 'Evidence note is required for advanced or expert proficiency', 400, 'EVIDENCE_REQUIRED');
    }

    const existing = await skillRepo.findByStudentAndTaxonomy(req.params.studentId, taxonomy_id);
    if (existing) {
      return error(res, 'You already have this skill added', 409, 'DUPLICATE_SKILL');
    }

    const skill = await skillRepo.create({
      student_id: req.params.studentId, taxonomy_id, skill_name: taxonomy.name, proficiency, evidence_note, years_experience, status: 'pending'
    });

    await verificationLogRepo.create({
      item_type: 'skill', item_id: skill._id, student_id: req.params.studentId, actor_id: req.user.userId,
      action: 'submitted', comment: `Skill "${taxonomy.name}" submitted at ${proficiency} level`
    });

    success(res, skill, {}, 201);
  } catch (err) {
    next(err);
  }
};

// TODO: Issue #123 - Implement Edit Skill functionality (PATCH /api/students/:studentId/skills/:skillId)
// This feature was deferred during Phase 1 UI Modernization.
// Requirements: Validate ownership, ensure status resets to 'pending' on major changes, update verificationLogRepo.

exports.deleteSkill = async (req, res, next) => {
  try {
    const skill = await skillRepo.findByStudentAndId(req.params.studentId, req.params.skillId);
    if (!skill) {
      return error(res, 'Skill not found', 404, 'NOT_FOUND');
    }

    if (skill.status === 'verified') {
      return error(res, 'Cannot delete a verified skill. Contact faculty to revoke.', 400, 'CANNOT_DELETE_VERIFIED');
    }

    await skillRepo.deleteById(req.params.skillId);
    success(res, { message: 'Skill removed successfully' });
  } catch (err) {
    next(err);
  }
};
