// controllers/studentController.js
const { validationResult } = require('express-validator');
const studentRepo = require('../repositories/studentRepo');
const placementRepo = require('../repositories/placementRepo');
const notificationRepo = require('../repositories/notificationRepo');
const { recalculateScore } = require('../services/readinessScore');
const { success, error } = require('../utils/response');

exports.getDashboard = async (req, res, next) => {
  try {
    if (req.user.baseRole !== 'student') {
      return error(res, 'Only students can access this dashboard', 403, 'FORBIDDEN');
    }

    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return error(res, 'Student profile not found', 404, 'NOT_FOUND');
    }

    const scoreData = await recalculateScore(student._id);
    const notifications = await notificationRepo.findByUserId(req.user.userId, {}, 0, 3);

    const dashboard = {
      readiness: {
        score: scoreData.score,
        tier: scoreData.tier,
        guidance: 'Keep improving your profile across all pillars to reach the next tier.',
        skills: { verified: scoreData.breakdown.skills_score, total: 20 },
        certs: { verified: scoreData.breakdown.certs_score, total: 20 },
        projects: { count: scoreData.breakdown.projects_score },
        coding: { count: scoreData.breakdown.coding_score },
        faculty: { count: scoreData.breakdown.faculty_score }
      },
      modules: [
        { id: 'profile', name: 'Profile', description: `${student.profile_completeness || 0}% Complete`, status: student.profile_completeness >= 80 ? 'Good' : 'Needs attention', action: 'Update', href: '/profile' },
        { id: 'skills', name: 'Skills', description: `Score: ${scoreData.breakdown.skills_score}/20`, status: 'Active', action: 'Manage', href: '/skills' },
        { id: 'projects', name: 'Projects', description: `Score: ${scoreData.breakdown.projects_score}/25`, status: 'Active', action: 'View', href: '/projects' },
        { id: 'certs', name: 'Certifications', description: `Score: ${scoreData.breakdown.certs_score}/20`, status: 'Active', action: 'View', href: '/certifications' },
        { id: 'coding', name: 'Coding Profile', description: `Score: ${scoreData.breakdown.coding_score}/15`, status: 'Active', action: 'View', href: '/coding' }
      ],
      notifications: notifications.map(n => ({ title: n.title, message: n.message, type: n.type, is_read: n.is_read, created_at: n.created_at }))
    };

    success(res, dashboard);
  } catch (err) {
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
          // Remove coding platform links — they belong in CodingProfiles
          for (const key of CODING_LINK_KEYS) {
            delete incomingLinks[key];
          }
          updateData.links = { ...student.links?.toObject?.() || {} };
          // Also strip any existing coding keys from stored links
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
      const Class = require('../models/Class');
      const classDoc = await Class.findById(req.body.class_id);
      if (!classDoc) {
        return error(res, 'Class not found', 404, 'CLASS_NOT_FOUND');
      }
      updateData.class_id = classDoc._id;
      updateData.department = classDoc.department;
      updateData.section = classDoc.section;
      updateData.batch_year = classDoc.batch_year;
      // Note: we might also update graduation_year and semester here depending on business logic
    }

    student = await studentRepo.updateById(req.params.studentId, updateData);
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
