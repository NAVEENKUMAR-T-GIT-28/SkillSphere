const { body } = require('express-validator');
const { sanitizeField } = require('../utils/sanitize');

exports.updateProfileValidator = [
  body('full_name').optional().trim().notEmpty().withMessage('Full name cannot be empty').customSanitizer(sanitizeField),
  body('phone').optional().trim(),
  body('profile_photo_url').optional().trim(),
  body('career_objective').optional().trim().isLength({ max: 500 }).withMessage('Career objective max 500 chars').customSanitizer(sanitizeField),
  body('cgpa').optional().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be 0-10'),
  body('links').optional().isObject().withMessage('Links must be an object'),
  body('class_id').optional().isMongoId().withMessage('Invalid class ID'),
  body('date_of_birth').optional({ nullable: true }).isISO8601().withMessage('Valid date of birth is required'),
  body('city').optional().trim().customSanitizer(sanitizeField),
  body('state').optional().trim().customSanitizer(sanitizeField),
  body('languages_known').optional().isArray().withMessage('Languages must be an array'),
  body('current_backlogs').optional().isInt({ min: 0 }).withMessage('Backlogs must be a non-negative integer'),
  body('backlog_history').optional().isInt({ min: 0 }).withMessage('Backlog history must be a non-negative integer'),
  body('tenth_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Percentage must be 0-100'),
  body('twelfth_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Percentage must be 0-100'),
  body('preferred_job_role').optional().trim().customSanitizer(sanitizeField),
  body('preferred_work_location').optional().trim().customSanitizer(sanitizeField)
];
