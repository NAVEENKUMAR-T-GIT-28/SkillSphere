const { body } = require('express-validator');
const { sanitizeField } = require('../utils/sanitize');

exports.addAchievementValidator = [
  body('title').notEmpty().trim().withMessage('Title is required').customSanitizer(sanitizeField),
  body('category').isIn(['hackathon', 'paper', 'patent', 'award', 'sports', 'ncc', 'nss', 'volunteer', 'competition', 'club', 'other']).withMessage('Invalid achievement category'),
  body('custom_category').optional().trim().customSanitizer(sanitizeField),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description max 500 chars').customSanitizer(sanitizeField),
  body('certificate_url').optional().trim()
];
