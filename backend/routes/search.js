/**
 * Search Routes
 * GET /api/search/students — Search students with filters
 */

const express = require('express');
const Student = require('../models/Student');
const Skill = require('../models/Skill');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { success, error } = require('../utils/response');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/search');

/**
 * GET /api/search/students
 * Search students with MongoDB $and query builder.
 * Filters: cgpa_min, cgpa_max, skills, department, section, batch_year, tier, name
 * Results sorted by readiness_score descending.
 * Faculty and HOD only.
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
        graduation_year,
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

      // Class filter resolution
      if (department || section || batch_year || graduation_year) {
        const { getClassIds } = require('../utils/classQuery');
        
        const classIds = await getClassIds({
          department,
          sections: section ? section.split(',').map(s => s.trim()).filter(Boolean) : undefined,
          batch_years: batch_year ? batch_year.split(',').map(Number).filter(Boolean) : undefined,
          graduation_year: graduation_year ? graduation_year.split(',').map(Number).filter(Boolean)[0] : undefined
        });

        if (classIds.length === 0) {
          return success(res, [], { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 });
        }
        filter.class_id = { $in: classIds };
      }

      // Readiness tier filter
      if (tier) {
        const tiers = tier.split(',').map(t => t.trim()).filter(Boolean);
        filter.readiness_tier = tiers.length > 1 ? { $in: tiers } : tiers[0];
      }

      // Name search (case-insensitive partial match)
      if (name) {
        filter.full_name = { $regex: name, $options: 'i' };
      }

      // Skills filter — find students who have ALL listed skills verified
      if (skills) {
        const skillNames = skills.split(',').map(s => s.trim()).filter(Boolean);

        const matchPipeline = [
          {
            $match: {
              skill_name: { $in: skillNames },
              status: 'verified'
            }
          },
          {
            $group: {
              _id: '$student_id',
              matchedSkills: { $addToSet: '$skill_name' }
            }
          },
          {
            $match: {
              $expr: { $eq: [{ $size: '$matchedSkills' }, skillNames.length] }
            }
          }
        ];

        const matchedStudents = await Skill.aggregate(matchPipeline);
        const matchedIds = matchedStudents.map(s => s._id);

        if (matchedIds.length === 0) {
          return success(res, [], { total: 0, page: parseInt(page), limit: parseInt(limit), pages: 0 });
        }

        filter._id = { $in: matchedIds };
      }

      // Sorting
      const sortObj = {};
      sortObj[sort_by] = sort_order === 'asc' ? 1 : -1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Student.countDocuments(filter);

      const students = await Student.find(filter)
        .select('-links') // exclude links from search results for privacy
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
