const { body } = require('express-validator');
const { sanitizeField } = require('../utils/sanitize');

exports.addSkillValidator = [
  body('taxonomy_id').isMongoId().withMessage('Valid taxonomy ID is required'),
  body('proficiency').isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Proficiency must be beginner, intermediate, advanced, or expert'),
  body('evidence_note').optional().trim().customSanitizer(sanitizeField),
  body('years_experience').optional().isFloat({ min: 0, max: 50 })
];
