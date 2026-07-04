/**
 * Class Routes
 * GET    /api/classes              — List all active classes (HOD, faculty, admin)
 * POST   /api/classes              — Create a class (HOD, admin)
 * GET    /api/classes/:id          — Get class details with enrolled students
 * PATCH  /api/classes/:id          — Update class (HOD)
 * DELETE /api/classes/:id          — Deactivate class (HOD)
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { trackRouter } = require('../utils/routeTracker');
const { createClassValidator } = require('../validators/class.validator');
const controller = require('../controllers/classController');

const router = trackRouter(express.Router(), '/api/classes');

router.get(
  '/',
  authenticate,
  requireRole('faculty', 'hod', 'admin'),
  controller.getClasses
);

router.post(
  '/',
  authenticate,
  requireRole('hod', 'admin'),
  createClassValidator,
  controller.createClass
);

router.get(
  '/:id',
  authenticate,
  requireRole('faculty', 'hod', 'admin'),
  controller.getClassDetails
);

router.patch(
  '/:id',
  authenticate,
  requireRole('hod'),
  controller.updateClass
);

router.delete(
  '/:id',
  authenticate,
  requireRole('hod'),
  controller.deleteClass
);

module.exports = router;
