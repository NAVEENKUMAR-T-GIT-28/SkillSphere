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
const { migrateClasses } = require('../scripts/migrateClassesV2');

router.get('/migrate-classes-v2', async (req, res) => {
  try {
    const result = await migrateClasses();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  '/create-hod',
  authenticate,
  requireRole('admin'),
  createHodValidator,
  controller.createHod
);

router.get('/debug-class', async (req, res) => {
  try {
    const Class = require('../models/Class');
    const c = await Class.findOne().lean();
    res.json(c);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
