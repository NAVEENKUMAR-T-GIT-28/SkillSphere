const { body } = require('express-validator');
const { sanitizeField } = require('../utils/sanitize');

exports.addInternshipValidator = [
  body('company').notEmpty().trim().withMessage('Company name is required').customSanitizer(sanitizeField),
  body('role').notEmpty().trim().withMessage('Role/title is required').customSanitizer(sanitizeField),
  body('internship_type').optional().trim(),
  body('location').optional().trim(),
  body('description').optional().trim(),
  body('company_logo_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid end date'),
  body('duration_months').optional().isFloat({ min: 0 }).withMessage('Duration must be a non-negative number'),
  body('stipend').optional().isFloat({ min: 0 }).withMessage('Stipend must be a non-negative number'),
  body('certificate_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL').trim(),
  body('offer_letter_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL').trim()
];
