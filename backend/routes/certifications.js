/**
 * Certifications Routes
 * GET    /api/students/:studentId/certifications           — List student's certifications
 * POST   /api/students/:studentId/certifications           — Add certification
 * PATCH  /api/students/:studentId/certifications/:certId   — Update certification
 * DELETE /api/students/:studentId/certifications/:certId   — Delete certification
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Certification = require('../models/Certification');
const VerificationLog = require('../models/VerificationLog');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { success, error } = require('../utils/response');
const { driveLink } = require('../utils/validators');

const router = express.Router();

/**
 * GET /api/students/:studentId/certifications
 * List all certifications for a student.
 */
router.get(
  '/:studentId/certifications',
  authenticate,
  requireOwnerOrRole('faculty', 'hod'),
  async (req, res, next) => {
    try {
      const { status, category } = req.query;
      const filter = { student_id: req.params.studentId };
      if (status) filter.status = status;
      if (category) filter.category = category;

      const certs = await Certification.find(filter)
        .populate('verified_by', 'email')
        .sort({ created_at: -1 });

      success(res, certs, { total: certs.length });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/students/:studentId/certifications
 * Add a new certification with Drive link.
 */
router.post(
  '/:studentId/certifications',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('title').notEmpty().trim().withMessage('Certificate title is required'),
    body('issuer').notEmpty().trim().withMessage('Issuer is required'),
    body('category')
      .isIn(['technical', 'language', 'soft_skills', 'domain', 'academic'])
      .withMessage('Invalid category'),
    body('issue_date').isISO8601().withMessage('Valid issue date is required'),
    body('expiry_date').optional({ nullable: true }).isISO8601().withMessage('Invalid expiry date'),
    driveLink('drive_link'),
    body('credential_id').optional().trim(),
    body('verification_url').optional().trim()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const cert = await Certification.create({
        student_id: req.params.studentId,
        ...req.body,
        status: 'pending'
      });

      // Log submission
      await VerificationLog.create({
        item_type: 'certification',
        item_id: cert._id,
        student_id: req.params.studentId,
        actor_id: req.user.userId,
        action: 'submitted',
        comment: `Certification "${req.body.title}" from ${req.body.issuer} submitted`
      });

      success(res, cert, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/students/:studentId/certifications/:certId
 * Update a certification. Cannot update if already verified.
 */
router.patch(
  '/:studentId/certifications/:certId',
  authenticate,
  requireOwnerOrRole('hod'),
  async (req, res, next) => {
    try {
      const cert = await Certification.findOne({
        _id: req.params.certId,
        student_id: req.params.studentId
      });

      if (!cert) {
        return error(res, 'Certification not found', 404, 'NOT_FOUND');
      }

      if (cert.status === 'verified' || cert.status === 'expired') {
        return error(
          res,
          'Cannot update a verified or expired certification. Submit a new one instead.',
          400,
          'CANNOT_UPDATE_LOCKED'
        );
      }

      const allowedFields = [
        'title', 'issuer', 'category', 'issue_date', 'expiry_date',
        'credential_id', 'verification_url', 'drive_link'
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          cert[field] = req.body[field];
        }
      }

      // Reset to pending if it was rejected and resubmitted
      if (cert.status === 'rejected') {
        cert.status = 'pending';
        cert.rejection_reason = undefined;
      }

      await cert.save();

      success(res, cert);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/students/:studentId/certifications/:certId
 * Delete a certification. Cannot delete if verified.
 */
router.delete(
  '/:studentId/certifications/:certId',
  authenticate,
  requireOwnerOrRole('hod'),
  async (req, res, next) => {
    try {
      const cert = await Certification.findOne({
        _id: req.params.certId,
        student_id: req.params.studentId
      });

      if (!cert) {
        return error(res, 'Certification not found', 404, 'NOT_FOUND');
      }

      if (cert.status === 'verified') {
        return error(res, 'Cannot delete a verified certification', 400, 'CANNOT_DELETE_VERIFIED');
      }

      await Certification.findByIdAndDelete(req.params.certId);

      success(res, { message: 'Certification deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
