/**
 * Auth Routes
 * POST /api/auth/register — Create new user + profile
 * POST /api/auth/login    — Authenticate and get JWT
 */

const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: { message: 'Too many login attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' } }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: { message: 'Too many registration attempts. Try again in an hour.', code: 'RATE_LIMITED' } }
});

router.post(
  '/register',
  registerLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('base_role').isIn(['student', 'faculty']).withMessage('Role must be student or faculty. HOD accounts are created by admin only.'),
    body('full_name').notEmpty().trim().withMessage('Full name is required'),
    body('roll_number').if(body('base_role').equals('student')).notEmpty().withMessage('Roll number is required for students'),
    body('department').notEmpty().trim().withMessage('Department is required'),
    body('batch_year').if(body('base_role').equals('student')).isInt().withMessage('Batch year is required for students'),
    body('graduation_year').if(body('base_role').equals('student')).isInt().withMessage('Graduation year is required for students'),
    body('employee_id').if(body('base_role').isIn(['faculty', 'hod'])).notEmpty().withMessage('Employee ID is required for faculty')
  ],
  authController.register
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

module.exports = router;
