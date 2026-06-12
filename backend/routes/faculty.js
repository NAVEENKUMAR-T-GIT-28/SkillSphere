/**
 * Faculty / Verification Routes
 * GET    /api/verification/queue                    — Get pending verification items
 * POST   /api/verification/:type/:itemId/approve    — Approve an item
 * POST   /api/verification/:type/:itemId/reject     — Reject an item
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Skill = require('../models/Skill');
const Certification = require('../models/Certification');
const Project = require('../models/Project');
const Student = require('../models/Student');
const VerificationLog = require('../models/VerificationLog');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { recalculateScore } = require('../services/readinessScore');
const { notifyVerificationApproved, notifyVerificationRejected, notifyScoreUpdated } = require('../services/notification');
const { success, error } = require('../utils/response');
const { sanitizeField } = require('../utils/sanitize');

const router = express.Router();

/**
 * Get the model for a given verification type.
 */
const getModel = (type) => {
  switch (type) {
    case 'skill': return Skill;
    case 'certification': return Certification;
    case 'project': return Project;
    default: return null;
  }
};

/**
 * Get student_id from an item based on its type.
 */
const getStudentId = (type, item) => {
  if (type === 'project') return item.created_by;
  return item.student_id;
};

/**
 * Get item name for notifications.
 */
const getItemName = (type, item) => {
  return item.title || item.skill_name || 'Unknown';
};

/**
 * GET /api/verification/queue
 * Get all pending items (skills, certifications, projects).
 * Faculty and HOD can access.
 */
router.get(
  '/queue',
  authenticate,
  requireRole('faculty', 'hod'),
  async (req, res, next) => {
    try {
      const { type, page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const result = {};

      if (!type || type === 'skill') {
        const pendingSkills = await Skill.find({ status: 'pending' })
          .populate('student_id', 'full_name roll_number department')
          .populate('taxonomy_id', 'category')
          .sort({ created_at: 1 })
          .skip(type === 'skill' ? skip : 0)
          .limit(type === 'skill' ? parseInt(limit) : 10);
        
        const totalSkills = await Skill.countDocuments({ status: 'pending' });
        result.skills = { items: pendingSkills, total: totalSkills };
      }

      if (!type || type === 'certification') {
        const pendingCerts = await Certification.find({ status: 'pending' })
          .populate('student_id', 'full_name roll_number department')
          .sort({ created_at: 1 })
          .skip(type === 'certification' ? skip : 0)
          .limit(type === 'certification' ? parseInt(limit) : 10);

        const totalCerts = await Certification.countDocuments({ status: 'pending' });
        result.certifications = { items: pendingCerts, total: totalCerts };
      }

      if (!type || type === 'project') {
        const pendingProjects = await Project.find({ status: 'pending' })
          .populate('student_ids', 'full_name roll_number department')
          .populate('created_by', 'full_name')
          .sort({ created_at: 1 })
          .skip(type === 'project' ? skip : 0)
          .limit(type === 'project' ? parseInt(limit) : 10);

        const totalProjects = await Project.countDocuments({ status: 'pending' });
        result.projects = { items: pendingProjects, total: totalProjects };
      }

      success(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/verification/:type/:itemId/approve
 * Approve a pending item. Faculty and HOD only.
 */
router.post(
  '/:type/:itemId/approve',
  authenticate,
  requireRole('faculty', 'hod'),
  [
    body('comment').optional().trim().customSanitizer(sanitizeField)
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const { type, itemId } = req.params;
      const Model = getModel(type);

      if (!Model) {
        return error(res, 'Invalid verification type. Use: skill, certification, or project', 400, 'INVALID_TYPE');
      }

      const item = await Model.findById(itemId);
      if (!item) {
        return error(res, `${type} not found`, 404, 'NOT_FOUND');
      }

      // Check current status
      const currentStatus = item.status;
      if (currentStatus === 'verified' || currentStatus === 'reviewed') {
        return error(res, `${type} is already ${currentStatus}`, 400, 'ALREADY_PROCESSED');
      }

      // Update item status
      if (type === 'project') {
        item.status = 'reviewed';
      } else {
        item.status = 'verified';
        item.verified_by = req.user.userId;
        item.verified_at = new Date();
      }

      await item.save();

      // Create verification log
      const studentId = getStudentId(type, item);
      await VerificationLog.create({
        item_type: type,
        item_id: item._id,
        student_id: studentId,
        actor_id: req.user.userId,
        action: 'approved',
        comment: req.body.comment
      });

      // Recalculate readiness score
      const scoreData = await recalculateScore(studentId);

      // Send notifications
      const itemName = getItemName(type, item);
      const studentDoc = await Student.findById(studentId).select('user_id');
      if (studentDoc) {
        await notifyVerificationApproved(studentDoc.user_id, type.charAt(0).toUpperCase() + type.slice(1), itemName);
        await notifyScoreUpdated(studentDoc.user_id, scoreData.score, scoreData.tier);
      }

      // For projects with team members, recalculate for all
      if (type === 'project' && item.student_ids.length > 1) {
        for (const sid of item.student_ids) {
          if (sid.toString() !== studentId.toString()) {
            const teamScoreData = await recalculateScore(sid);
            const teamStudentDoc = await Student.findById(sid).select('user_id');
            if (teamStudentDoc) {
              await notifyScoreUpdated(teamStudentDoc.user_id, teamScoreData.score, teamScoreData.tier);
            }
          }
        }
      }

      success(res, {
        item,
        score_update: scoreData
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/verification/:type/:itemId/reject
 * Reject a pending item. Faculty and HOD only.
 */
router.post(
  '/:type/:itemId/reject',
  authenticate,
  requireRole('faculty', 'hod'),
  [
    body('reason').notEmpty().trim().withMessage('Rejection reason is required').customSanitizer(sanitizeField),
    body('comment').optional().trim().customSanitizer(sanitizeField)
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const { type, itemId } = req.params;
      const Model = getModel(type);

      if (!Model) {
        return error(res, 'Invalid verification type. Use: skill, certification, or project', 400, 'INVALID_TYPE');
      }

      const item = await Model.findById(itemId);
      if (!item) {
        return error(res, `${type} not found`, 404, 'NOT_FOUND');
      }

      const currentStatus = item.status;
      if (currentStatus === 'verified' || currentStatus === 'reviewed') {
        return error(res, `${type} is already ${currentStatus}`, 400, 'ALREADY_PROCESSED');
      }

      // Update item status
      item.status = 'rejected';
      item.rejection_reason = req.body.reason;
      if (type !== 'project') {
        item.verified_by = req.user.userId;
        item.verified_at = new Date();
      }

      await item.save();

      // Create verification log
      const studentId = getStudentId(type, item);
      await VerificationLog.create({
        item_type: type,
        item_id: item._id,
        student_id: studentId,
        actor_id: req.user.userId,
        action: 'rejected',
        comment: req.body.reason
      });

      // Recalculate readiness score
      const scoreData = await recalculateScore(studentId);

      // Send notification
      const itemName = getItemName(type, item);
      const studentDoc = await Student.findById(studentId).select('user_id');
      if (studentDoc) {
        await notifyVerificationRejected(studentDoc.user_id, type.charAt(0).toUpperCase() + type.slice(1), itemName, req.body.reason);
      }

      success(res, {
        item,
        score_update: scoreData
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
