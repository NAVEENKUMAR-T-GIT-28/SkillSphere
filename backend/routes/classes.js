/**
 * Class Routes
 * GET    /api/classes              — List all active classes (HOD, faculty, admin)
 * POST   /api/classes              — Create a class (HOD, admin)
 * GET    /api/classes/:id          — Get class details with enrolled students
 * PATCH  /api/classes/:id          — Update class (HOD)
 * DELETE /api/classes/:id          — Deactivate class (HOD)
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const Student = require('../models/Student');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { success, error } = require('../utils/response');
const { trackRouter } = require('../utils/routeTracker');

const router = trackRouter(express.Router(), '/api/classes');

/**
 * GET /api/classes
 * List all active classes. Faculty and HOD.
 */
router.get(
  '/',
  authenticate,
  requireRole('faculty', 'hod', 'admin'),
  async (req, res, next) => {
    try {
      const { department, batch_year, is_active = 'true' } = req.query;
      const filter = {};

      if (is_active !== 'all') filter.is_active = is_active === 'true';
      if (department) filter.department = department;
      if (batch_year) filter.batch_year = parseInt(batch_year);

      const classes = await Class.find(filter).sort({ department: 1, batch_year: 1, section: 1 });
      success(res, classes, { total: classes.length });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/classes
 * Create a new class. HOD only.
 */
router.post(
  '/',
  authenticate,
  requireRole('hod', 'admin'),
  [
    body('department').notEmpty().trim().withMessage('Department is required'),
    body('section').notEmpty().trim().withMessage('Section is required'),
    body('batch_year').isInt({ min: 2000 }).withMessage('Valid batch year is required'),
    body('graduation_year').isInt({ min: 2000 }).withMessage('Valid graduation year is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const { department, section, batch_year, graduation_year } = req.body;

      const existing = await Class.findOne({ department, section, batch_year });
      if (existing) {
        return error(res, `Class ${department}-${section}-${batch_year} already exists`, 409, 'CLASS_EXISTS');
      }

      // Compute academic year and semester based on current date, or simply default them
      // In this setup, we expect batch_year and graduation_year. Let's provide defaults for academic_year/semester.
      // E.g., assume newly created classes start at academic_year 1, semester 1.
      const newClass = await Class.create({ 
        department, 
        section, 
        batch_year, 
        graduation_year,
        academic_year: 1,
        semester: 1 
      });
      success(res, newClass, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/classes/:id
 * Get class details and enrolled students.
 */
router.get(
  '/:id',
  authenticate,
  requireRole('faculty', 'hod', 'admin'),
  async (req, res, next) => {
    try {
      const classDoc = await Class.findById(req.params.id);
      if (!classDoc) {
        return error(res, 'Class not found', 404, 'NOT_FOUND');
      }

      const students = await Student.find({ class_id: req.params.id })
        .select('full_name roll_number cgpa readiness_score readiness_tier section')
        .sort({ roll_number: 1 });

      success(res, { class: classDoc, students, total_students: students.length });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/classes/:id
 * Update a class. HOD only.
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('hod'),
  async (req, res, next) => {
    try {
      const classDoc = await Class.findById(req.params.id);
      if (!classDoc) {
        return error(res, 'Class not found', 404, 'NOT_FOUND');
      }

      const allowedFields = ['graduation_year', 'is_active', 'academic_year', 'semester'];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) classDoc[field] = req.body[field];
      }

      await classDoc.save();
      success(res, classDoc);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/classes/:id
 * Soft-delete (deactivate) a class. HOD only.
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('hod'),
  async (req, res, next) => {
    try {
      const classDoc = await Class.findById(req.params.id);
      if (!classDoc) {
        return error(res, 'Class not found', 404, 'NOT_FOUND');
      }

      classDoc.is_active = false;
      await classDoc.save();

      success(res, { message: 'Class deactivated successfully', class: classDoc });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
