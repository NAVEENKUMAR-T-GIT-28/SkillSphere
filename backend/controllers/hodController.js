// controllers/hodController.js
const { validationResult } = require('express-validator');
const studentRepo = require('../repositories/studentRepo');
const skillRepo = require('../repositories/skillRepo');
const certificationRepo = require('../repositories/certificationRepo');
const projectRepo = require('../repositories/projectRepo');
const placementRepo = require('../repositories/placementRepo');
const verificationLogRepo = require('../repositories/verificationLogRepo');
const userRepo = require('../repositories/userRepo');
const facultyRepo = require('../repositories/facultyRepo');
const { notifyRoleAssigned } = require('../services/notification');
const { success, error } = require('../utils/response');

exports.getDashboard = async (req, res, next) => {
  try {
    const totalStudents = await studentRepo.countDocuments();
    const tierDistribution = await studentRepo.aggregate([{ $group: { _id: '$readiness_tier', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const avgScoreResult = await studentRepo.aggregate([{ $group: { _id: null, avg: { $avg: '$readiness_score' } } }]);
    const avgReadinessScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avg * 100) / 100 : 0;
    const departmentStats = await studentRepo.aggregate([{ $group: { _id: '$department', count: { $sum: 1 }, avg_score: { $avg: '$readiness_score' }, avg_cgpa: { $avg: '$cgpa' } } }, { $sort: { avg_score: -1 } }]);
    const pendingSkills = await skillRepo.countDocuments({ status: 'pending' });
    const pendingCerts = await certificationRepo.countDocuments({ status: 'pending' });
    const pendingProjects = await projectRepo.countDocuments({ status: 'pending' });
    const verifiedSkills = await skillRepo.countDocuments({ status: 'verified' });
    const verifiedCerts = await certificationRepo.countDocuments({ status: 'verified' });
    const reviewedProjects = await projectRepo.countDocuments({ status: 'reviewed' });
    const activeDrives = await placementRepo.countDrives({ status: { $in: ['upcoming', 'active'] } });
    const totalApplications = await placementRepo.countApplications();
    const selectedStudents = await placementRepo.countApplications({ status: 'selected' });
    const topStudents = await studentRepo.findAll({}, 'full_name roll_number department readiness_score readiness_tier cgpa').sort({ readiness_score: -1 }).limit(10);
    const RoleAssignment = require('../models/RoleAssignment');
    const activeRoles = await RoleAssignment.countDocuments({ revoked_at: null });
    const topSkills = await skillRepo.aggregate([{ $match: { status: 'verified' } }, { $group: { _id: '$skill_name', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);

    success(res, {
      overview: { total_students: totalStudents, avg_readiness_score: avgReadinessScore, active_drives: activeDrives, active_roles: activeRoles },
      tier_distribution: tierDistribution,
      department_stats: departmentStats.map(d => ({ department: d._id, count: d.count, avg_score: Math.round(d.avg_score * 100) / 100, avg_cgpa: Math.round(d.avg_cgpa * 100) / 100 })),
      verification: { pending: { skills: pendingSkills, certifications: pendingCerts, projects: pendingProjects }, completed: { skills: verifiedSkills, certifications: verifiedCerts, projects: reviewedProjects } },
      placement: { active_drives: activeDrives, total_applications: totalApplications, selected_students: selectedStudents },
      top_students: topStudents, top_skills: topSkills
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllStudents = async (req, res, next) => {
  try {
    const { department, batch_year, section, tier, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (batch_year) filter.batch_year = parseInt(batch_year);
    if (section) filter.section = section;
    if (tier) filter.readiness_tier = tier;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await studentRepo.countDocuments(filter);
    const students = await studentRepo.findAll(filter).populate('user_id', 'email is_active').sort({ readiness_score: -1 }).skip(skip).limit(parseInt(limit));

    success(res, students, { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

exports.createRoleAssignment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');

    const { user_id, role, scope_type, scope_id, scope_label, scope_data } = req.body;
    const user = await userRepo.findById(user_id);
    if (!user) return error(res, 'User not found', 404, 'USER_NOT_FOUND');

    const RoleAssignment = require('../models/RoleAssignment');
    const existing = await RoleAssignment.findOne({ user_id, role, scope_type, scope_label, revoked_at: null });
    if (existing) return error(res, `User already has an active ${role} role for ${scope_label}`, 409, 'ROLE_EXISTS');

    const assignment = await RoleAssignment.create({ user_id, role, scope_type, scope_id, scope_label, scope_data, assigned_by: req.user.userId });
    await notifyRoleAssigned(user_id, role, scope_label);

    success(res, assignment, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.getRoleAssignments = async (req, res, next) => {
  try {
    const RoleAssignment = require('../models/RoleAssignment');
    const assignments = await RoleAssignment.find({ revoked_at: null }).populate('user_id', 'email base_role').sort({ created_at: -1 });

    const enriched = await Promise.all(assignments.map(async (a) => {
      const obj = a.toObject();
      if (a.user_id?.base_role === 'student') {
        const student = await studentRepo.findByUserId(a.user_id._id);
        obj.assignee_name = student ? `${student.full_name} (${student.roll_number})` : a.user_id.email;
      } else {
        const faculty = await facultyRepo.findByUserId(a.user_id._id);
        obj.assignee_name = faculty ? `${faculty.full_name} (${faculty.employee_id})` : a.user_id.email;
      }
      return obj;
    }));
    success(res, enriched);
  } catch (err) {
    next(err);
  }
};

exports.revokeRoleAssignment = async (req, res, next) => {
  try {
    const RoleAssignment = require('../models/RoleAssignment');
    const assignment = await RoleAssignment.findById(req.params.id);
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
    const { item_type, action, student_id, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (item_type) filter.item_type = item_type;
    if (action) filter.action = action;
    if (student_id) filter.student_id = student_id;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await verificationLogRepo.countDocuments(filter);
    const logs = await verificationLogRepo.find(filter, skip, parseInt(limit));

    success(res, logs, { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { search, role, limit = 10 } = req.query;
    if (!search) return success(res, []);

    const queryLimit = parseInt(limit);
    const regex = new RegExp(search, 'i');
    const User = require('../models/User');
    const matchingUsers = await User.find({ email: regex }).select('_id');
    const userIds = matchingUsers.map(u => u._id);

    if (role === 'student') {
      const students = await studentRepo.findAll({
        $or: [{ full_name: regex }, { roll_number: regex }, { user_id: { $in: userIds } }]
      }).populate('user_id', 'email').limit(queryLimit);
      const formatted = students.map(s => ({
        _id: s.user_id?._id || s.user_id, name: s.full_name, email: s.user_id?.email || '', department: s.department, studentId: s._id
      }));
      return success(res, formatted);
    } else if (role === 'faculty') {
      const faculty = await facultyRepo.find({
        $or: [{ full_name: regex }, { employee_id: regex }, { user_id: { $in: userIds } }]
      }, 0, queryLimit);
      const formatted = faculty.map(f => ({
        _id: f.user_id?._id || f.user_id, name: f.full_name, email: f.user_id?.email || '', department: f.department
      }));
      return success(res, formatted);
    } else {
      return error(res, 'Role must be student or faculty', 400, 'INVALID_ROLE');
    }
  } catch (err) {
    next(err);
  }
};

exports.getClasses = async (req, res, next) => {
  try {
    const classes = await studentRepo.aggregate([
      { $group: { _id: { department: "$department", section: "$section", batch_year: "$batch_year" } } },
      { $project: { _id: 0, department: "$_id.department", section: "$_id.section", batch_year: "$_id.batch_year", label: { $concat: ["$_id.department", "-", "$_id.section", "-", { $toString: "$_id.batch_year" }] } } },
      { $sort: { department: 1, batch_year: 1, section: 1 } }
    ]);
    success(res, classes);
  } catch (err) {
    next(err);
  }
};
