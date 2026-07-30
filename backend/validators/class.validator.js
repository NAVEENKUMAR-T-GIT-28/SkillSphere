const { body } = require('express-validator');

exports.createClassValidator = [
  body('department').notEmpty().trim().withMessage('Department is required'),
  body('section').notEmpty().trim().withMessage('Section is required'),
  body('batch_start').isInt({ min: 2000 }).withMessage('Valid batch start year is required'),
];
