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

exports.getProfile = async (req, res, next) => {
  try {
    const student = await studentRepo.findById(req.params.studentId);
    if (!student) {
      return error(res, 'Student not found', 404, 'NOT_FOUND');
    }
    success(res, student);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    let student = await studentRepo.findById(req.params.studentId);
    if (!student) {
      return error(res, 'Student not found', 404, 'NOT_FOUND');
    }

    const allowedFields = [
      'full_name', 'phone', 'profile_photo_url', 'career_objective', 'cgpa', 'links',
      'date_of_birth', 'city', 'state', 'languages_known',
      'current_backlogs', 'backlog_history', 'tenth_percentage', 'twelfth_percentage',
      'preferred_job_role', 'preferred_work_location'
    ];
    const updateData = {};
    // Coding platform keys that must NOT be stored in Student.links
    const CODING_LINK_KEYS = ['leetcode', 'hackerrank', 'codechef', 'skillrack', 'codeforces'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'links') {
          const incomingLinks = { ...req.body.links };
          for (const key of CODING_LINK_KEYS) {
            delete incomingLinks[key];
          }
          updateData.links = { ...student.links?.toObject?.() || {} };
          for (const key of CODING_LINK_KEYS) {
            delete updateData.links[key];
          }
          Object.assign(updateData.links, incomingLinks);
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    if (req.body.class_id !== undefined) {
      const classDoc = await classRepo.findById(req.body.class_id);
      if (!classDoc) {
        return error(res, 'Class not found', 404, 'CLASS_NOT_FOUND');
      }
      updateData.class_id = classDoc._id;
      updateData.department = classDoc.department;
      updateData.section = classDoc.section;
      updateData.batch_year = classDoc.batch_year;
    }

    student = await studentRepo.updateById(req.params.studentId, updateData);
    // Fire-and-forget: sync StudentSearch after profile update
    syncStudentSearch(req.params.studentId).catch(err => console.error('StudentSearch sync failed:', err));
    success(res, student);
  } catch (err) {
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
