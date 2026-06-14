const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { success, error } = require('../utils/response');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/admin');

/**
 * POST /api/admin/create-hod
 * Admin-only: create a HOD account.
 */
router.post(
  '/create-hod',
  authenticate,
  requireRole('admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').notEmpty().trim(),
    body('department').notEmpty().trim(),
    body('employee_id').notEmpty().trim(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const { email, password, full_name, department, employee_id, phone, designation } = req.body;

      const existing = await User.findOne({ email });
      if (existing) return error(res, 'Email already registered', 409, 'EMAIL_EXISTS');

      const user = await User.create({ email, password, base_role: 'hod' });
      const profile = await Faculty.create({
        user_id: user._id, full_name, department, employee_id,
        designation: designation || 'Head of Department', phone
      });

      success(res, { userId: user._id, profileId: profile._id }, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
