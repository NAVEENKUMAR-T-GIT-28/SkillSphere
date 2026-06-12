/**
 * Auth Routes
 * POST /api/auth/register — Create new user + profile
 * POST /api/auth/login    — Authenticate and get JWT
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { success, error } = require('../utils/response');
const { getKeys } = require('../utils/jwtKeys');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// 10 attempts per 15 minutes per IP on login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: { message: 'Too many login attempts. Try again in 15 minutes.', code: 'RATE_LIMITED' }
  }
});

// 5 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: { message: 'Too many registration attempts. Try again in an hour.', code: 'RATE_LIMITED' }
  }
});

/**
 * Generate JWT token for a user.
 */
const generateToken = (user) => {
  const { privateKey } = getKeys();
  return jwt.sign(
    { userId: user._id, baseRole: user.base_role },
    privateKey,
    { 
      algorithm: 'RS256',
      expiresIn: process.env.JWT_EXPIRES_IN || '8h' 
    }
  );
};

/**
 * POST /api/auth/register
 * Register a new user (student or faculty).
 */
router.post(
  '/register',
  registerLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('base_role').isIn(['student', 'faculty']).withMessage('Role must be student or faculty. HOD accounts are created by admin only.'),
    body('full_name').notEmpty().trim().withMessage('Full name is required'),
    // Student-specific fields
    body('roll_number').if(body('base_role').equals('student')).notEmpty().withMessage('Roll number is required for students'),
    body('department').notEmpty().trim().withMessage('Department is required'),
    body('batch_year').if(body('base_role').equals('student')).isInt().withMessage('Batch year is required for students'),
    body('graduation_year').if(body('base_role').equals('student')).isInt().withMessage('Graduation year is required for students'),
    // Faculty-specific fields
    body('employee_id').if(body('base_role').isIn(['faculty', 'hod'])).notEmpty().withMessage('Employee ID is required for faculty')
  ],
  async (req, res, next) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const { email, password, base_role, full_name, phone, department } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return error(res, 'Email already registered', 409, 'EMAIL_EXISTS');
      }

      // Create user
      const user = await User.create({ email, password, base_role });

      // Create role-specific profile
      let profile;

      if (base_role === 'student') {
        const { roll_number, batch_year, graduation_year, section, semester, cgpa } = req.body;

        profile = await Student.create({
          user_id: user._id,
          full_name,
          phone,
          roll_number,
          department,
          batch_year,
          graduation_year,
          section,
          semester,
          cgpa
        });
      } else {
        // faculty or hod
        const { employee_id, designation } = req.body;

        profile = await Faculty.create({
          user_id: user._id,
          full_name,
          department,
          designation,
          employee_id,
          phone
        });
      }

      // Generate JWT
      const token = generateToken(user);

      success(res, {
        token,
        user: {
          id: user._id,
          email: user.email,
          baseRole: user.base_role,
          name: full_name,
          profileId: profile._id
        }
      }, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const { email, password } = req.body;

      // Find user with password (select: false by default)
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return error(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Check if account is active
      if (!user.is_active) {
        return error(res, 'Account has been deactivated. Contact your HOD.', 403, 'ACCOUNT_DEACTIVATED');
      }

      // Compare password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return error(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
      }

      // Get profile name and profileId
      let name = '';
      let profileId = null;
      if (user.base_role === 'student') {
        const student = await Student.findOne({ user_id: user._id });
        name = student?.full_name || '';
        profileId = student?._id || null;
      } else {
        const faculty = await Faculty.findOne({ user_id: user._id });
        name = faculty?.full_name || '';
        profileId = faculty?._id || null;
      }

      // Generate JWT
      const token = generateToken(user);

      success(res, {
        token,
        user: {
          id: user._id,
          email: user.email,
          baseRole: user.base_role,
          name,
          profileId
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
