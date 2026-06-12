const express = require('express');
const Student = require('../models/Student');
const RoleAssignment = require('../models/RoleAssignment');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const router = express.Router();

// GET /api/my/mentees  — faculty: list students they mentor
router.get('/mentees', authenticate, async (req, res, next) => {
  try {
    const assignments = await RoleAssignment.find({
      user_id: req.user.userId, role: 'mentor', revoked_at: null
    });
    const studentIds = assignments.map(a => a.scope_id).filter(Boolean);
    const students = await Student.find({ _id: { $in: studentIds } });
    success(res, students, { total: students.length });
  } catch (err) { next(err); }
});

// GET /api/my/class  — CC or rep: list students in their class/section
router.get('/class', authenticate, async (req, res, next) => {
  try {
    const assignment = await RoleAssignment.findOne({
      user_id: req.user.userId, role: { $in: ['cc', 'rep'] }, revoked_at: null
    });
    if (!assignment) {
      return error(res, 'No class/section assigned', 403, 'ROLE_NOT_ASSIGNED');
    }
    // scope_label is expected to encode department/batch/section, e.g. "CSE-A-2026"
    // For now we do string split per bugs.md suggestion
    const parts = assignment.scope_label.split('-');
    if (parts.length === 3) {
      const [department, section, batch_year] = parts;
      const students = await Student.find({ department, section, batch_year: Number(batch_year) });
      success(res, students, { total: students.length });
    } else {
      // fallback
      success(res, [], { total: 0 });
    }
  } catch (err) { next(err); }
});

module.exports = router;
