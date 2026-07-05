// controllers/studentController.js
const { validationResult } = require('express-validator');
const studentRepo = require('../repositories/studentRepo');
const classRepo = require('../repositories/classRepo');
const placementRepo = require('../repositories/placementRepo');
const { recalculateScore } = require('../services/readinessScore');
const { buildDashboard } = require('../services/studentDashboard');
const { syncStudentSearch } = require('../services/studentSearchSync');
const { success, error } = require('../utils/response');

exports.getDashboard = async (req, res, next) => {
  try {
    const dashboard = await buildDashboard(req.user.userId, req.user.baseRole);
    success(res, dashboard);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code);
    }
    next(err);
  }
};


exports.getApplications = async (req, res, next) => {
  try {
    const student = await studentRepo.findById(req.params.studentId);
    if (!student) {
      return error(res, 'Student not found', 404, 'NOT_FOUND');
    }

    const applications = await placementRepo.findApplications({ student_id: req.params.studentId });
    success(res, applications, { total: applications.length });
  } catch (err) {
    next(err);
  }
};

exports.getReadinessScore = async (req, res, next) => {
  try {
    const student = await studentRepo.findById(req.params.studentId);
    if (!student) {
      return error(res, 'Student not found', 404, 'NOT_FOUND');
    }

    const scoreData = await recalculateScore(student._id);
    success(res, {
      student_id: student._id,
      full_name: student.full_name,
      ...scoreData
    });
  } catch (err) {
    next(err);
  }
};
