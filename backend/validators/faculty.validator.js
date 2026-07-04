const { body } = require('express-validator');
const { sanitizeField } = require('../utils/sanitize');

exports.approveItemValidator = [
  body('comment').optional().trim().customSanitizer(sanitizeField)
];

exports.rejectItemValidator = [
  body('reason').notEmpty().trim().withMessage('Rejection reason is required').customSanitizer(sanitizeField),
  body('comment').optional().trim().customSanitizer(sanitizeField)
];
