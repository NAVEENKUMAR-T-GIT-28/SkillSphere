/**
 * Student Routes
 * GET    /api/students/:studentId/profile — Get student profile
 * PATCH  /api/students/:studentId/profile — Update student profile
 * GET    /api/students/:studentId/score   — Get readiness score breakdown
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { recalculateScore } = require('../services/readinessScore');
const { success, error } = require('../utils/response');

const router = express.Router();

/**
 * GET /api/students/dashboard
 * Get comprehensive student dashboard data including readiness breakdown, modules, and notifications
 */
router.get(
  '/dashboard',
  authenticate,
  async (req, res, next) => {
    try {
      if (req.user.baseRole !== 'student') {
        return error(res, 'Only students can access this dashboard', 403, 'FORBIDDEN');
      }

      const student = await Student.findOne({ user_id: req.user.userId });
      if (!student) {
        return error(res, 'Student profile not found', 404, 'NOT_FOUND');
      }

      // 1. Get readiness score up-to-date
      const scoreData = await recalculateScore(student._id);

      // 2. Fetch recent notifications
      const notifications = await Notification.find({ user_id: req.user.userId })
        .sort({ created_at: -1 })
        .limit(3)
        .select('title message type is_read created_at');

      // 3. Prepare dashboard payload
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
        notifications
      };

      success(res, dashboard);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/students/:studentId/profile
 * Get student profile. Owner, faculty, or HOD can access.
 */
router.get(
  '/:studentId/profile',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  async (req, res, next) => {
    try {
      const student = await Student.findById(req.params.studentId)
        .populate('user_id', 'email base_role is_active');

      if (!student) {
        return error(res, 'Student not found', 404, 'NOT_FOUND');
      }

      success(res, student);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/students/:studentId/profile
 * Update student profile. Owner or HOD can update.
 */
router.patch(
  '/:studentId/profile',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().trim(),
    body('profile_photo_url').optional().trim(),
    body('career_objective').optional().trim().isLength({ max: 500 }).withMessage('Career objective max 500 chars'),
    body('department').optional().trim(),
    body('section').optional().trim(),
    body('semester').optional().isInt({ min: 1, max: 8 }).withMessage('Semester must be 1-8'),
    body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be 0-10'),
    body('links').optional().isObject().withMessage('Links must be an object')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const student = await Student.findById(req.params.studentId);
      if (!student) {
        return error(res, 'Student not found', 404, 'NOT_FOUND');
      }

      // Allowed update fields
      const allowedFields = [
        'full_name', 'phone', 'profile_photo_url', 'career_objective',
        'department', 'section', 'semester', 'cgpa', 'links'
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (field === 'links') {
            // Merge links instead of replacing
            student.links = { ...student.links?.toObject?.() || {}, ...req.body.links };
          } else {
            student[field] = req.body[field];
          }
        }
      }

      await student.save(); // triggers profile_completeness recalculation

      success(res, student);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/students/:studentId/score
 * Get readiness score with full breakdown. Owner, faculty, or HOD can access.
 */
router.get(
  '/:studentId/score',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  async (req, res, next) => {
    try {
      const student = await Student.findById(req.params.studentId);
      if (!student) {
        return error(res, 'Student not found', 404, 'NOT_FOUND');
      }

      // Recalculate for fresh data
      const scoreData = await recalculateScore(student._id);

      success(res, {
        student_id: student._id,
        full_name: student.full_name,
        ...scoreData
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
