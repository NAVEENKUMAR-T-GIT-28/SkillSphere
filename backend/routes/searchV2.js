/**
 * Search V2 Routes
 * GET /api/search/v2/students — Search students from StudentSearch (denormalized)
 *
 * This is an ADDITIVE endpoint. The original /api/search/students is unchanged
 * and remains the production endpoint used by the frontend.
 * This V2 endpoint reads from the StudentSearch collection for validation
 * and performance comparison. It will NOT replace the original until
 * explicitly approved in a future change.
 */

const express = require('express');
const StudentSearch = require('../models/StudentSearch');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { success } = require('../utils/response');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/search/v2');

/**
 * GET /api/search/v2/students
 * Same filter interface as /api/search/students, but reads from
 * the denormalized StudentSearch collection (single-collection query,
 * no aggregation pipeline).
 */
router.get(
  '/students',
  authenticate,
  requireRole('faculty', 'hod'),
  async (req, res, next) => {
    try {
      const {
        cgpa_min,
        cgpa_max,
        skills,        // comma-separated skill names (verified)
        department,
        section,
        batch_year,
        tier,
        name,          // partial name search
        page = 1,
        limit = 20,
        sort_by = 'readiness_score',
        sort_order = 'desc'
      } = req.query;

      const filter = {};

      // CGPA range filter
      if (cgpa_min || cgpa_max) {
        filter.cgpa = {};
        if (cgpa_min) filter.cgpa.$gte = parseFloat(cgpa_min);
        if (cgpa_max) filter.cgpa.$lte = parseFloat(cgpa_max);
      }

      // Department/section/batch — direct fields on StudentSearch (no Class join needed)
      if (department) {
        filter.department = department;
      }
      if (section) {
        const sections = section.split(',').map(s => s.trim()).filter(Boolean);
        filter.section = sections.length > 1 ? { $in: sections } : sections[0];
      }
      if (batch_year) {
        const batchYears = batch_year.split(',').map(Number).filter(Boolean);
        filter.batch_year = batchYears.length > 1 ? { $in: batchYears } : batchYears[0];
      }

      // Readiness tier filter
      if (tier) {
        const tiers = tier.split(',').map(t => t.trim()).filter(Boolean);
        filter.readiness_tier = tiers.length > 1 ? { $in: tiers } : tiers[0];
      }

      // Name search (case-insensitive partial match)
      if (name) {
        filter.name = { $regex: name, $options: 'i' };
      }

      // Skills filter — find students who have ALL listed skills (single-collection query)
      if (skills) {
        const skillNames = skills.split(',').map(s => s.trim()).filter(Boolean);
        filter.verified_skills = { $all: skillNames };
      }

      // Sorting
      const sortObj = {};
      sortObj[sort_by] = sort_order === 'asc' ? 1 : -1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await StudentSearch.countDocuments(filter);

      const students = await StudentSearch.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit));

      success(res, students, {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
