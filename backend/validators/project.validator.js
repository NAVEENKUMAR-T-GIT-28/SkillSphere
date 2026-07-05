const { body } = require('express-validator');
const { sanitizeField } = require('../utils/sanitize');

exports.addProjectValidator = [
  body('title').notEmpty().trim().withMessage('Project title is required').customSanitizer(sanitizeField),
  body('description').optional().trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters').customSanitizer(sanitizeField),
  body('tech_stack').isArray({ min: 1 }).withMessage('At least one technology must be specified'),
  body('tech_stack.*').trim().notEmpty(),
  body('github_url').notEmpty().isURL().withMessage('Must be a valid URL'),
  body('live_demo_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL'),
  body('complexity_tier').isIn(['basic', 'intermediate', 'advanced']).withMessage('Invalid complexity tier'),
  body('student_ids').optional().isArray().withMessage('student_ids must be an array of ObjectIds'),
  body('thumbnail_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL'),
  body('completion_status').optional().isIn(['completed', 'in_progress']).withMessage('Invalid completion status'),
  body('start_date').optional({ checkFalsy: true }).isISO8601().withMessage('Must be a valid date'),
  body('end_date').optional({ checkFalsy: true }).isISO8601().withMessage('Must be a valid date'),
  body('is_featured').optional().isBoolean()
];

exports.rateProjectValidator = [
  body('functionality').isInt({ min: 1, max: 5 }),
  body('code_quality').isInt({ min: 1, max: 5 }),
  body('documentation').isInt({ min: 1, max: 5 }),
  body('innovation').isInt({ min: 1, max: 5 }),
  body('complexity').isInt({ min: 1, max: 5 }),
  body('feedback').optional().trim().customSanitizer(sanitizeField)
];
