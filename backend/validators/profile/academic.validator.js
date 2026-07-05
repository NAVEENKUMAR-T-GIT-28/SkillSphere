const { body } = require('express-validator');

exports.updateAcademicValidator = [
  body('department')
    .optional()
    .trim(),
  body('section')
    .optional()
    .trim(),
  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8'),
  body('cgpa')
    .optional()
    .isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10')
];
