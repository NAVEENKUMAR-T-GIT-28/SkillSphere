// controllers/facultyController.js
const { validationResult } = require('express-validator');
const skillRepo = require('../repositories/skillRepo');
const certificationRepo = require('../repositories/certificationRepo');
const projectRepo = require('../repositories/projectRepo');
const internshipRepo = require('../repositories/internshipRepo');
const achievementRepo = require('../repositories/achievementRepo');
const { approveItem, rejectItem } = require('../services/verification');
const { buildVerificationScope, verifyVerificationPermission } = require('../services/authorization');
const { success, error } = require('../utils/response');

const getRepo = (type) => {
  switch (type) {
    case 'skill': return skillRepo;
    case 'certification': return certificationRepo;
    case 'project': return projectRepo;
    case 'internship': return internshipRepo;
    case 'achievement': return achievementRepo;
    default: return null;
  }
};

const getStudentId = (type, item) => {
  if (type === 'project') return item.created_by;
  return item.student_id;
};

exports.getVerificationQueue = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const result = {};

    const scope = await buildVerificationScope(req.user.userId);
    // If scope.student_id is null, it means no permission.
    // The repositories handle this cleanly by returning [] and 0.

    if (!type || type === 'skill') {
      const pendingSkills = await skillRepo.findPending(type === 'skill' ? skip : 0, type === 'skill' ? parseInt(limit) : 10, scope);
      const totalSkills = await skillRepo.countPending(scope);
      result.skills = { items: pendingSkills, total: totalSkills };
    }

    if (!type || type === 'certification') {
      const pendingCerts = await certificationRepo.findPending(type === 'certification' ? skip : 0, type === 'certification' ? parseInt(limit) : 10, scope);
      const totalCerts = await certificationRepo.countPending(scope);
      result.certifications = { items: pendingCerts, total: totalCerts };
    }

    if (!type || type === 'project') {
      const pendingProjects = await projectRepo.findPending(type === 'project' ? skip : 0, type === 'project' ? parseInt(limit) : 10, scope);
      const totalProjects = await projectRepo.countPending(scope);
      result.projects = { items: pendingProjects, total: totalProjects };
    }

    if (!type || type === 'internship') {
      const pendingInternships = await internshipRepo.findPending(type === 'internship' ? skip : 0, type === 'internship' ? parseInt(limit) : 10, scope);
      const totalInternships = await internshipRepo.countPending(scope);
      result.internships = { items: pendingInternships, total: totalInternships };
    }

    if (!type || type === 'achievement') {
      const pendingAchievements = await achievementRepo.findPending(type === 'achievement' ? skip : 0, type === 'achievement' ? parseInt(limit) : 10, scope);
      const totalAchievements = await achievementRepo.countPending(scope);
      result.achievements = { items: pendingAchievements, total: totalAchievements };
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
    
    // Auth Check
    const repo = getRepo(type);
    if (!repo) return error(res, 'Invalid verification type', 400, 'INVALID_TYPE');
    const item = await repo.findById(itemId);
    if (!item) return error(res, 'Item not found', 404, 'NOT_FOUND');
    
    const studentId = getStudentId(type, item);
    const auth = await verifyVerificationPermission(req.user.userId, studentId);
    if (!auth.allowed) {
      return error(res, auth.reason, 403, 'NOT_AUTHORIZED_TO_VERIFY');
    }

    const { item: approvedItem, scoreData } = await approveItem(type, itemId, req.user.userId, req.body.comment);
    
    success(res, { item: approvedItem, score_update: scoreData });
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
    
    // Auth Check
    const repo = getRepo(type);
    if (!repo) return error(res, 'Invalid verification type', 400, 'INVALID_TYPE');
    const item = await repo.findById(itemId);
    if (!item) return error(res, 'Item not found', 404, 'NOT_FOUND');
    
    const studentId = getStudentId(type, item);
    const auth = await verifyVerificationPermission(req.user.userId, studentId);
    if (!auth.allowed) {
      return error(res, auth.reason, 403, 'NOT_AUTHORIZED_TO_VERIFY');
    }

    const { item: rejectedItem, scoreData } = await rejectItem(type, itemId, req.user.userId, req.body.reason, req.body.comment);
    
    success(res, { item: rejectedItem, score_update: scoreData });
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code || 'ERROR');
    }
    next(err);
  }
};
