const { body } = require('express-validator');

exports.updateBasicValidator = [
  body('full_name')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name cannot be empty if provided'),
  body('phone')
    .optional()
    .trim()
    .matches(/^\d{10}$/).withMessage('Phone number must be 10 digits'),
  body('alternate_phone')
    .optional()
    .trim()
    .matches(/^\d{10}$/).withMessage('Alternate phone number must be 10 digits'),
  body('gender')
    .optional()
    .trim()
    .isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Invalid gender value'),
  body('date_of_birth')
    .optional()
    .isISO8601().withMessage('Date of birth must be a valid ISO format date'),
  body('city')
    .optional()
    .trim(),
  body('state')
    .optional()
    .trim(),
  body('country')
    .optional()
    .trim(),
  body('pincode')
    .optional()
    .trim(),
  body('languages')
    .optional()
    .isArray().withMessage('Languages must be an array of strings')
];
