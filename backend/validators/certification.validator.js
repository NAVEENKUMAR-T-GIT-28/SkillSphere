const { body } = require('express-validator');
const { driveLink } = require('./common');

exports.addCertificationValidator = [
  body('title').notEmpty().trim().withMessage('Certificate title is required'),
  body('issuer').notEmpty().trim().withMessage('Issuer is required'),
  body('category').isIn(['technical', 'language', 'soft_skills', 'domain', 'academic']).withMessage('Invalid category'),
  body('issue_date').isISO8601().withMessage('Valid issue date is required'),
  body('expiry_date').optional({ nullable: true }).isISO8601().withMessage('Invalid expiry date'),
  driveLink('drive_link'),
  body('credential_id').optional().trim(),
  body('verification_url').optional().trim()
];
