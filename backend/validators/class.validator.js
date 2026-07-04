const { body } = require('express-validator');

exports.createClassValidator = [
  body('department').notEmpty().trim().withMessage('Department is required'),
  body('section').notEmpty().trim().withMessage('Section is required'),
  body('batch_year').isInt({ min: 2000 }).withMessage('Valid batch year is required'),
  body('graduation_year').isInt({ min: 2000 }).withMessage('Valid graduation year is required'),
];
