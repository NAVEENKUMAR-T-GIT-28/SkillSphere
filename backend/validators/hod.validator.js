const { body } = require('express-validator');

exports.createRoleAssignmentValidator = [
  body('user_id').isMongoId().withMessage('Valid user ID is required'),
  body('role').isIn(['rep', 'mentor', 'cc']).withMessage('Role must be rep, mentor, or cc'),
  body('scope_type').isIn(['student', 'class', 'section']).withMessage('Invalid scope type'),
  body('scope_id').optional().isMongoId().withMessage('Valid scope ID required'),
  body('scope_label').notEmpty().trim().withMessage('Scope label is required'),
  body('scope_data').optional().isObject(),
  body('scope_data.department').optional().trim(),
  body('scope_data.section').optional().trim(),
  body('scope_data.batch_year').optional().isInt(),
  body('class_id')
    .if(body('role').isIn(['cc', 'rep']))
    .isMongoId()
    .withMessage('class_id is required for cc and rep roles')
];

exports.updateClassSemesterValidator = [
  body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be 1-8')
];
