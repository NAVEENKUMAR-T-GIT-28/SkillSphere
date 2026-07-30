const { body } = require('express-validator');

exports.registerValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('base_role').isIn(['student', 'faculty']).withMessage('Role must be student or faculty. HOD accounts are created by admin only.'),
  body('full_name').notEmpty().trim().withMessage('Full name is required'),
  body('roll_number').if(body('base_role').equals('student')).notEmpty().withMessage('Roll number is required for students'),
  body('class_id').if(body('base_role').equals('student')).isMongoId().withMessage('Class ID is required for students'),
  body('department').if(body('base_role').isIn(['faculty', 'hod'])).notEmpty().trim().withMessage('Department is required for faculty'),
  body('employee_id').if(body('base_role').isIn(['faculty', 'hod'])).notEmpty().withMessage('Employee ID is required for faculty')
];

exports.loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];
