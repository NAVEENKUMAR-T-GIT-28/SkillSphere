// controllers/facultyController.js
const { validationResult } = require('express-validator');
const skillRepo = require('../repositories/skillRepo');
const certificationRepo = require('../repositories/certificationRepo');
const projectRepo = require('../repositories/projectRepo');
const { approveItem, rejectItem } = require('../services/verification');
const { success, error } = require('../utils/response');

exports.getVerificationQueue = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const result = {};

    if (!type || type === 'skill') {
      const pendingSkills = await skillRepo.findPending(type === 'skill' ? skip : 0, type === 'skill' ? parseInt(limit) : 10).populate('student_id', 'full_name roll_number department').populate('taxonomy_id', 'category');
      const totalSkills = await skillRepo.countDocuments({ status: 'pending' });
      result.skills = { items: pendingSkills, total: totalSkills };
    }

    if (!type || type === 'certification') {
      const pendingCerts = await certificationRepo.findPending(type === 'certification' ? skip : 0, type === 'certification' ? parseInt(limit) : 10).populate('student_id', 'full_name roll_number department');
      const totalCerts = await certificationRepo.countDocuments({ status: 'pending' });
      result.certifications = { items: pendingCerts, total: totalCerts };
    }

    if (!type || type === 'project') {
      const pendingProjects = await projectRepo.findPending(type === 'project' ? skip : 0, type === 'project' ? parseInt(limit) : 10).populate('student_ids', 'full_name roll_number department').populate('created_by', 'full_name');
      const totalProjects = await projectRepo.countDocuments({ status: 'pending' });
      result.projects = { items: pendingProjects, total: totalProjects };
    }

    success(res, result);
  } catch (err) {
    next(err);
  }
};

exports.approveItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const { type, itemId } = req.params;
    const { item, scoreData } = await approveItem(type, itemId, req.user.userId, req.body.comment);
    
    success(res, { item, score_update: scoreData });
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code || 'ERROR');
    }
    next(err);
  }
};

exports.rejectItem = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const { type, itemId } = req.params;
    const { item, scoreData } = await rejectItem(type, itemId, req.user.userId, req.body.reason, req.body.comment);
    
    success(res, { item, score_update: scoreData });
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code || 'ERROR');
    }
    next(err);
  }
};
