/**
 * HOD Routes
 * GET    /api/hod/dashboard              — Dashboard stats (aggregation pipeline)
 * GET    /api/hod/students               — All students with any filter
 * POST   /api/hod/role-assignments       — Assign dynamic role
 * DELETE /api/hod/role-assignments/:id   — Revoke dynamic role
 * GET    /api/hod/verification-logs      — Audit trail
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Skill = require('../models/Skill');
const Certification = require('../models/Certification');
const Project = require('../models/Project');
const PlacementDrive = require('../models/PlacementDrive');
const Application = require('../models/Application');
const RoleAssignment = require('../models/RoleAssignment');
const VerificationLog = require('../models/VerificationLog');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { notifyRoleAssigned } = require('../services/notification');
const { success, error } = require('../utils/response');

const router = express.Router();

/**
 * GET /api/hod/dashboard
 * Dashboard statistics via aggregation pipeline.
 */
router.get(
  '/dashboard',
  authenticate,
  requireRole('hod'),
  async (req, res, next) => {
    try {
      // Total students
      const totalStudents = await Student.countDocuments();

      // Tier distribution
      const tierDistribution = await Student.aggregate([
        { $group: { _id: '$readiness_tier', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      // Average readiness score
      const avgScoreResult = await Student.aggregate([
        { $group: { _id: null, avg: { $avg: '$readiness_score' } } }
      ]);
      const avgReadinessScore = avgScoreResult.length > 0
        ? Math.round(avgScoreResult[0].avg * 100) / 100
        : 0;

      // Department-wise stats
      const departmentStats = await Student.aggregate([
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 },
            avg_score: { $avg: '$readiness_score' },
            avg_cgpa: { $avg: '$cgpa' }
          }
        },
        { $sort: { avg_score: -1 } }
      ]);

      // Verification stats
      const pendingSkills = await Skill.countDocuments({ status: 'pending' });
      const pendingCerts = await Certification.countDocuments({ status: 'pending' });
      const pendingProjects = await Project.countDocuments({ status: 'pending' });

      const verifiedSkills = await Skill.countDocuments({ status: 'verified' });
      const verifiedCerts = await Certification.countDocuments({ status: 'verified' });
      const reviewedProjects = await Project.countDocuments({ status: 'reviewed' });

      // Placement stats
      const activeDrives = await PlacementDrive.countDocuments({ status: { $in: ['upcoming', 'active'] } });
      const totalApplications = await Application.countDocuments();
      const selectedStudents = await Application.countDocuments({ status: 'selected' });

      // Top students by readiness score
      const topStudents = await Student.find()
        .select('full_name roll_number department readiness_score readiness_tier cgpa')
        .sort({ readiness_score: -1 })
        .limit(10);

      // Active role assignments
      const activeRoles = await RoleAssignment.countDocuments({ revoked_at: null });

      // Skills popularity (top 10 most added skills)
      const topSkills = await Skill.aggregate([
        { $match: { status: 'verified' } },
        { $group: { _id: '$skill_name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      success(res, {
        overview: {
          total_students: totalStudents,
          avg_readiness_score: avgReadinessScore,
          active_drives: activeDrives,
          active_roles: activeRoles
        },
        tier_distribution: tierDistribution,
        department_stats: departmentStats.map(d => ({
          department: d._id,
          count: d.count,
          avg_score: Math.round(d.avg_score * 100) / 100,
          avg_cgpa: Math.round(d.avg_cgpa * 100) / 100
        })),
        verification: {
          pending: { skills: pendingSkills, certifications: pendingCerts, projects: pendingProjects },
          completed: { skills: verifiedSkills, certifications: verifiedCerts, projects: reviewedProjects }
        },
        placement: {
          active_drives: activeDrives,
          total_applications: totalApplications,
          selected_students: selectedStudents
        },
        top_students: topStudents,
        top_skills: topSkills
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/hod/students
 * All students with filtering. HOD only.
 */
router.get(
  '/students',
  authenticate,
  requireRole('hod'),
  async (req, res, next) => {
    try {
      const { department, batch_year, section, tier, page = 1, limit = 50 } = req.query;
      const filter = {};

      if (department) filter.department = department;
      if (batch_year) filter.batch_year = parseInt(batch_year);
      if (section) filter.section = section;
      if (tier) filter.readiness_tier = tier;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Student.countDocuments(filter);

      const students = await Student.find(filter)
        .populate('user_id', 'email is_active')
        .sort({ readiness_score: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      success(res, students, {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/hod/role-assignments
 * Assign a dynamic role (mentor, cc, rep).
 */
router.post(
  '/role-assignments',
  authenticate,
  requireRole('hod'),
  [
    body('user_id').isMongoId().withMessage('Valid user ID is required'),
    body('role').isIn(['rep', 'mentor', 'cc']).withMessage('Role must be rep, mentor, or cc'),
    body('scope_type').isIn(['student', 'class', 'section']).withMessage('Invalid scope type'),
    body('scope_id').optional().isMongoId().withMessage('Valid scope ID required'),
    body('scope_label').notEmpty().trim().withMessage('Scope label is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const { user_id, role, scope_type, scope_id, scope_label } = req.body;

      // Verify user exists
      const user = await User.findById(user_id);
      if (!user) {
        return error(res, 'User not found', 404, 'USER_NOT_FOUND');
      }

      // Check for existing active assignment of same role
      const existing = await RoleAssignment.findOne({
        user_id,
        role,
        scope_type,
        scope_label,
        revoked_at: null
      });
      if (existing) {
        return error(res, `User already has an active ${role} role for ${scope_label}`, 409, 'ROLE_EXISTS');
      }

      const assignment = await RoleAssignment.create({
        user_id,
        role,
        scope_type,
        scope_id,
        scope_label,
        assigned_by: req.user.userId
      });

      // Notify the assigned user
      await notifyRoleAssigned(user_id, role, scope_label);

      success(res, assignment, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/hod/role-assignments
 * Get all active role assignments.
 */
router.get(
  '/role-assignments',
  authenticate,
  requireRole('hod'),
  async (req, res, next) => {
    try {
      const assignments = await RoleAssignment.find({ revoked_at: null })
        .populate('user_id', 'email')
        .sort({ created_at: -1 });

      // We might need to manually attach names if user_id points to User which only has email.
      // But the frontend expects the assigned user's name. Let's map it.
      // We will leave it as is and frontend can handle, or we populate.
      success(res, assignments);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/hod/role-assignments/:id
 * Revoke a dynamic role assignment.
 */
router.delete(
  '/role-assignments/:id',
  authenticate,
  requireRole('hod'),
  async (req, res, next) => {
    try {
      const assignment = await RoleAssignment.findById(req.params.id);
      if (!assignment) {
        return error(res, 'Role assignment not found', 404, 'NOT_FOUND');
      }

      if (assignment.revoked_at) {
        return error(res, 'Role assignment already revoked', 400, 'ALREADY_REVOKED');
      }

      assignment.revoked_at = new Date();
      assignment.revoke_reason = req.body.reason || 'Revoked by HOD';
      await assignment.save();

      success(res, { message: 'Role assignment revoked', assignment });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/hod/verification-logs
 * Audit trail. HOD only.
 */
router.get(
  '/verification-logs',
  authenticate,
  requireRole('hod'),
  async (req, res, next) => {
    try {
      const { item_type, action, student_id, page = 1, limit = 50 } = req.query;
      const filter = {};

      if (item_type) filter.item_type = item_type;
      if (action) filter.action = action;
      if (student_id) filter.student_id = student_id;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await VerificationLog.countDocuments(filter);

      const logs = await VerificationLog.find(filter)
        .populate('student_id', 'full_name roll_number')
        .populate('actor_id', 'email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      success(res, logs, {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
