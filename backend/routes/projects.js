/**
 * Projects Routes
 * GET    /api/students/:studentId/projects              — List student's projects
 * POST   /api/students/:studentId/projects              — Add project
 * PATCH  /api/students/:studentId/projects/:projectId   — Update project
 * POST   /api/projects/:projectId/rate                  — Faculty rates a project
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const VerificationLog = require('../models/VerificationLog');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { recalculateScore } = require('../services/readinessScore');
const { notifyScoreUpdated } = require('../services/notification');
const { success, error } = require('../utils/response');

const router = express.Router();

/**
 * GET /api/students/:studentId/projects
 * List all projects for a student.
 */
router.get(
  '/students/:studentId/projects',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  async (req, res, next) => {
    try {
      const projects = await Project.find({ student_ids: req.params.studentId })
        .populate('student_ids', 'full_name roll_number')
        .populate('faculty_rating.rated_by', 'email')
        .sort({ created_at: -1 });

      success(res, projects, { total: projects.length });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/students/:studentId/projects
 * Add a new project.
 */
router.post(
  '/students/:studentId/projects',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('title').notEmpty().trim().withMessage('Project title is required'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description max 1000 chars'),
    body('tech_stack').isArray({ min: 1 }).withMessage('At least one technology is required'),
    body('github_url').notEmpty().trim().withMessage('GitHub URL is required'),
    body('complexity_tier')
      .isIn(['basic', 'intermediate', 'advanced'])
      .withMessage('Complexity must be basic, intermediate, or advanced'),
    body('live_demo_url').optional().trim(),
    body('thumbnail_url').optional().trim(),
    body('team_member_ids').optional().isArray()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const { title, description, tech_stack, github_url, live_demo_url, thumbnail_url, complexity_tier, team_member_ids, is_featured } = req.body;

      // Build student_ids array (creator + team members)
      const studentIds = [req.params.studentId];
      if (team_member_ids && team_member_ids.length > 0) {
        for (const id of team_member_ids) {
          if (!studentIds.includes(id)) {
            studentIds.push(id);
          }
        }
      }

      const project = await Project.create({
        student_ids: studentIds,
        created_by: req.params.studentId,
        title,
        description,
        tech_stack,
        github_url,
        live_demo_url,
        thumbnail_url,
        complexity_tier,
        is_featured: is_featured || false,
        status: 'pending'
      });

      // Log submission
      await VerificationLog.create({
        item_type: 'project',
        item_id: project._id,
        student_id: req.params.studentId,
        actor_id: req.user.userId,
        action: 'submitted',
        comment: `Project "${title}" submitted as ${complexity_tier}`
      });

      success(res, project, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/students/:studentId/projects/:projectId
 * Update a project. Cannot update if already reviewed.
 */
router.patch(
  '/students/:studentId/projects/:projectId',
  authenticate,
  requireOwnerOrRole('hod'),
  async (req, res, next) => {
    try {
      const project = await Project.findOne({
        _id: req.params.projectId,
        student_ids: req.params.studentId
      });

      if (!project) {
        return error(res, 'Project not found', 404, 'NOT_FOUND');
      }

      const allowedFields = [
        'title', 'description', 'tech_stack', 'github_url',
        'live_demo_url', 'thumbnail_url', 'complexity_tier', 'is_featured'
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          project[field] = req.body[field];
        }
      }

      await project.save();

      success(res, project);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/projects/:projectId/rate
 * Faculty rates a project (1-5 on 5 dimensions).
 */
router.post(
  '/projects/:projectId/rate',
  authenticate,
  requireRole('faculty', 'hod'),
  [
    body('functionality').isInt({ min: 1, max: 5 }).withMessage('Functionality must be 1-5'),
    body('code_quality').isInt({ min: 1, max: 5 }).withMessage('Code quality must be 1-5'),
    body('documentation').isInt({ min: 1, max: 5 }).withMessage('Documentation must be 1-5'),
    body('innovation').isInt({ min: 1, max: 5 }).withMessage('Innovation must be 1-5'),
    body('complexity').isInt({ min: 1, max: 5 }).withMessage('Complexity must be 1-5'),
    body('feedback').optional().trim()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return error(res, 'Project not found', 404, 'NOT_FOUND');
      }

      const { functionality, code_quality, documentation, innovation, complexity, feedback } = req.body;
      const average = (functionality + code_quality + documentation + innovation + complexity) / 5;

      project.faculty_rating = {
        rated_by: req.user.userId,
        rated_at: new Date(),
        functionality,
        code_quality,
        documentation,
        innovation,
        complexity,
        average: Math.round(average * 100) / 100,
        feedback
      };
      project.status = 'reviewed';

      await project.save();

      // Recalculate score for all team members
      for (const studentId of project.student_ids) {
        const scoreData = await recalculateScore(studentId);
        await notifyScoreUpdated(studentId, scoreData.score, scoreData.tier);
      }

      success(res, project);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
