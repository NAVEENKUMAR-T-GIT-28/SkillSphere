const { body } = require('express-validator');
const { sanitizeField } = require('../utils/sanitize');

exports.createDriveValidator = [
  body('company_name').notEmpty().trim().withMessage('Company name is required').customSanitizer(sanitizeField),
  body('role_title').notEmpty().trim().withMessage('Role title is required').customSanitizer(sanitizeField),
  body('drive_date').isISO8601().withMessage('Valid drive date is required'),
  body('application_deadline').isISO8601().withMessage('Valid application deadline is required'),
  body('drive_type').isIn(['oncampus', 'offcampus', 'internship']).withMessage('Drive type must be oncampus, offcampus, or internship'),
  body('eligibility').optional().isObject(),
  body('eligibility.class_ids').optional().isArray()
];

exports.updateApplicationStatusValidator = [
  body('status').isIn(['shortlisted', 'round1', 'round2', 'selected', 'rejected']).withMessage('Invalid status'),
  body('notes').optional().trim().customSanitizer(sanitizeField)
];
