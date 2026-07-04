const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/admin');

/**
 * POST /api/admin/create-hod
 * Admin-only: create a HOD account.
 */
const { createHodValidator } = require('../validators/admin.validator');

const controller = require('../controllers/adminController');

router.post(
  '/create-hod',
  authenticate,
  requireRole('admin'),
  createHodValidator,
  controller.createHod
);

module.exports = router;
