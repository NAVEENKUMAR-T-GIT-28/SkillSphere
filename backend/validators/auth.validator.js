const { body } = require('express-validator');

exports.registerValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('base_role').isIn(['student', 'faculty']).withMessage('Role must be student or faculty. HOD accounts are created by admin only.'),
  body('full_name').notEmpty().trim().withMessage('Full name is required'),
  body('roll_number').if(body('base_role').equals('student')).notEmpty().withMessage('Roll number is required for students'),
  body('department').notEmpty().trim().withMessage('Department is required'),
  body('batch_year').if(body('base_role').equals('student')).isInt().withMessage('Batch year is required for students'),
  body('graduation_year').if(body('base_role').equals('student')).isInt().withMessage('Graduation year is required for students'),
  body('employee_id').if(body('base_role').isIn(['faculty', 'hod'])).notEmpty().withMessage('Employee ID is required for faculty'),
  body('class_id').optional().isMongoId().withMessage('Invalid class ID')
];

exports.loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];
