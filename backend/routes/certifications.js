/**
 * Certifications Routes
 * GET    /api/students/:studentId/certifications           — List student's certifications
 * POST   /api/students/:studentId/certifications           — Add certification
 * PATCH  /api/students/:studentId/certifications/:certId   — Update certification
 * DELETE /api/students/:studentId/certifications/:certId   — Delete certification
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireOwnerOrRole } = require('../middleware/ownerGuard');
const certificationController = require('../controllers/certificationController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/students');

router.get('/:studentId/certifications', authenticate, requireOwnerOrRole('faculty', 'hod'), certificationController.getCertifications);

const { addCertificationValidator } = require('../validators/certification.validator');

router.post(
  '/:studentId/certifications',
  authenticate,
  requireOwnerOrRole('hod'),
  addCertificationValidator,
  certificationController.addCertification
);

router.patch('/:studentId/certifications/:certId', authenticate, requireOwnerOrRole('hod'), certificationController.updateCertification);

router.delete('/:studentId/certifications/:certId', authenticate, requireOwnerOrRole('hod'), certificationController.deleteCertification);

module.exports = router;
