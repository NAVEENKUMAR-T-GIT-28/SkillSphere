/**
 * Auth Routes
 * POST /api/auth/register — Create new user + profile
 * POST /api/auth/login    — Authenticate and get JWT
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/auth');

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

const { registerValidator, loginValidator } = require('../validators/auth.validator');

router.post(
  '/register',
  registerLimiter,
  registerValidator,
  authController.register
);

router.post(
  '/login',
  loginLimiter,
  loginValidator,
  authController.login
);

module.exports = router;
