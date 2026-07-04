const { body } = require('express-validator');
const { driveLink } = require('./common');
const { sanitizeField } = require('../utils/sanitize');

exports.addResumeValidator = [
  driveLink('drive_link'),
  body('label').optional().trim().customSanitizer(sanitizeField),
  body('resume_version_name').optional().trim().customSanitizer(sanitizeField)
];
