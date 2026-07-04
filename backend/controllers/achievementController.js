// controllers/achievementController.js
const { validationResult } = require('express-validator');
const achievementRepo = require('../repositories/achievementRepo');
const verificationLogRepo = require('../repositories/verificationLogRepo');
const { success, error } = require('../utils/response');

exports.getAchievements = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const achievements = await achievementRepo.findByStudentId(req.params.studentId);
    let filtered = achievements;
    if (status) filtered = filtered.filter(a => a.status === status);
    if (category) filtered = filtered.filter(a => a.category === category);
    filtered.sort((a, b) => b.created_at - a.created_at);
    success(res, filtered, { total: filtered.length });
  } catch (err) {
    next(err);
  }
};

exports.addAchievement = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const achievement = await achievementRepo.create({
      student_id: req.params.studentId, ...req.body, status: 'pending'
    });

    await verificationLogRepo.create({
      item_type: 'achievement', item_id: achievement._id, student_id: req.params.studentId, actor_id: req.user.userId,
      action: 'submitted', comment: `Achievement "${req.body.title}" (${req.body.category}) submitted`
    });

    success(res, achievement, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateAchievement = async (req, res, next) => {
  try {
    let achievement = await achievementRepo.findByStudentAndId(req.params.studentId, req.params.achievementId);
    if (!achievement) {
      return error(res, 'Achievement not found', 404, 'NOT_FOUND');
    }

    if (achievement.status === 'verified') {
      return error(res, 'Cannot update a verified achievement. Submit a new one instead.', 400, 'CANNOT_UPDATE_LOCKED');
    }

    const allowedFields = ['title', 'category', 'custom_category', 'description', 'certificate_url'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (achievement.status === 'rejected') {
      updateData.status = 'pending';
      updateData.rejection_reason = undefined;
    }

    achievement = await achievementRepo.updateById(req.params.achievementId, updateData);
    success(res, achievement);
  } catch (err) {
    next(err);
  }
};

exports.deleteAchievement = async (req, res, next) => {
  try {
    const achievement = await achievementRepo.findByStudentAndId(req.params.studentId, req.params.achievementId);
    if (!achievement) {
      return error(res, 'Achievement not found', 404, 'NOT_FOUND');
    }

    if (achievement.status === 'verified') {
      return error(res, 'Cannot delete a verified achievement', 400, 'CANNOT_DELETE_VERIFIED');
    }

    await achievementRepo.deleteById(req.params.achievementId);
    success(res, { message: 'Achievement deleted successfully' });
  } catch (err) {
    next(err);
  }
};
