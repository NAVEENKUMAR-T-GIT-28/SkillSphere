const { body } = require('express-validator');

exports.createHodValidator = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('full_name').notEmpty().trim(),
  body('department').notEmpty().trim(),
  body('employee_id').notEmpty().trim(),
];
