// controllers/hodController.js
const { validationResult } = require('express-validator');
const {
  getDashboard, getAllStudents, searchUsers,
  createRoleAssignment, getRoleAssignments,
  getClasses, updateClassSemester, getVerificationLogs
} = require('../services/hodService');
const roleAssignmentRepo = require('../repositories/roleAssignmentRepo');
const { success, error } = require('../utils/response');

exports.getDashboard = async (req, res, next) => {
  try {
    const data = await getDashboard();
    success(res, data);
  } catch (err) {
    next(err);
  }
};

exports.getAllStudents = async (req, res, next) => {
  try {
    const { students, meta } = await getAllStudents(req.query);
    success(res, students, meta);
  } catch (err) {
    next(err);
  }
};

exports.createRoleAssignment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');

    const assignment = await createRoleAssignment({
      ...req.body,
      assigned_by: req.user.userId
    });
    success(res, assignment, {}, 201);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code);
    }
    next(err);
  }
};

exports.getRoleAssignments = async (req, res, next) => {
  try {
    const enriched = await getRoleAssignments();
    success(res, enriched);
  } catch (err) {
    next(err);
  }
};

exports.revokeRoleAssignment = async (req, res, next) => {
  try {
    const assignment = await roleAssignmentRepo.findById(req.params.id);
    if (!assignment) return error(res, 'Role assignment not found', 404, 'NOT_FOUND');
    if (assignment.revoked_at) return error(res, 'Role assignment already revoked', 400, 'ALREADY_REVOKED');

    assignment.revoked_at = new Date();
    assignment.revoke_reason = req.body.reason || 'Revoked by HOD';
    await assignment.save();

    success(res, { message: 'Role assignment revoked', assignment });
  } catch (err) {
    next(err);
  }
};

exports.getVerificationLogs = async (req, res, next) => {
  try {
    const { logs, meta } = await getVerificationLogs(req.query);
    success(res, logs, meta);
  } catch (err) {
    next(err);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const result = await searchUsers(req.query);
    success(res, result);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code);
    }
    next(err);
  }
};

exports.getClasses = async (req, res, next) => {
  try {
    const classes = await getClasses();
    success(res, classes);
  } catch (err) {
    next(err);
  }
};

exports.updateClassSemester = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, data: null, error: { message: errors.array().map(e => e.msg).join(', '), code: 'VALIDATION_ERROR' } });
    }

    const cls = await updateClassSemester(req.params.classId, req.body.semester);
    success(res, cls);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, data: null, error: { message: err.message, code: err.code } });
    }
    next(err);
  }
};
