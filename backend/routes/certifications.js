/**
 * Certifications Routes
 * GET    /api/students/:studentId/certifications           — List student's certifications
 * POST   /api/students/:studentId/certifications           — Add certification
 * PATCH  /api/students/:studentId/certifications/:certId   — Update certification
 * DELETE /api/students/:studentId/certifications/:certId   — Delete certification
 */

const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const { driveLink } = require('../utils/validators');
const certificationController = require('../controllers/certificationController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

router.get('/:studentId/certifications', authenticate, requireOwnerOrRole('faculty', 'hod'), certificationController.getCertifications);

router.post(
  '/:studentId/certifications',
  authenticate,
  requireOwnerOrRole('hod'),
  [
    body('title').notEmpty().trim().withMessage('Certificate title is required'),
    body('issuer').notEmpty().trim().withMessage('Issuer is required'),
    body('category').isIn(['technical', 'language', 'soft_skills', 'domain', 'academic']).withMessage('Invalid category'),
    body('issue_date').isISO8601().withMessage('Valid issue date is required'),
    body('expiry_date').optional({ nullable: true }).isISO8601().withMessage('Invalid expiry date'),
    driveLink('drive_link'),
    body('credential_id').optional().trim(),
    body('verification_url').optional().trim()
  ],
  certificationController.addCertification
);

router.patch('/:studentId/certifications/:certId', authenticate, requireOwnerOrRole('hod'), certificationController.updateCertification);

router.delete('/:studentId/certifications/:certId', authenticate, requireOwnerOrRole('hod'), certificationController.deleteCertification);

module.exports = router;
