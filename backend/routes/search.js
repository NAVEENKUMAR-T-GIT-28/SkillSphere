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

const router = express.Router();

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

      // Department filter
      if (department) {
        filter.department = department;
      }

      // Section filter
      if (section) {
        filter.section = section;
      }

      // Batch year filter
      if (batch_year) {
        filter.batch_year = parseInt(batch_year);
      }

      // Graduation year filter
      if (graduation_year) {
        filter.graduation_year = parseInt(graduation_year);
      }

      // Readiness tier filter
      if (tier) {
        filter.readiness_tier = tier;
      }

      // Name search (case-insensitive partial match)
      if (name) {
        filter.full_name = { $regex: name, $options: 'i' };
      }

      // Skills filter — find students who have ALL listed skills verified
      if (skills) {
        const skillNames = skills.split(',').map(s => s.trim());

        // Find student IDs that have all required skills verified
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
              [`matchedSkills.${skillNames.length - 1}`]: { $exists: true }
            }
          }
        ];

        const matchedStudents = await Skill.aggregate(matchPipeline);
        const matchedIds = matchedStudents.map(s => s._id);

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
