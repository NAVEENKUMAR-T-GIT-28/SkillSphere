const { body } = require('express-validator');

exports.updateCareerValidator = [
  body('career_objective')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Career objective cannot exceed 500 characters'),
  body('preferred_job_role')
    .optional()
    .trim(),
  body('preferred_locations')
    .optional()
    .isArray().withMessage('Preferred locations must be an array of strings')
];
