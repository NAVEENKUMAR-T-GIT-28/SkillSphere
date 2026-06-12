const express = require('express');
const Student = require('../models/Student');
const RoleAssignment = require('../models/RoleAssignment');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { success, error } = require('../utils/response');

const router = express.Router();

// GET /api/my/mentees  — faculty: list students they mentor
router.get('/mentees', authenticate, requireRole('faculty', 'hod'), async (req, res, next) => {
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
router.get('/class', authenticate, requireRole('faculty', 'student', 'hod'), async (req, res, next) => {
  try {
    const assignment = await RoleAssignment.findOne({
      user_id: req.user.userId, role: { $in: ['cc', 'rep'] }, revoked_at: null
    });
    if (!assignment) {
      return error(res, 'No class/section assigned', 403, 'ROLE_NOT_ASSIGNED');
    }
    
    // Use structured scope_data if available, fall back to label parsing
    let filter = {};
    if (assignment.scope_data && assignment.scope_data.department) {
      const { department, section, batch_year } = assignment.scope_data;
      if (department) filter.department = department;
      if (section) filter.section = section;
      if (batch_year) filter.batch_year = batch_year;
    } else {
      // Legacy fallback
      const parts = assignment.scope_label ? assignment.scope_label.split('-') : [];
      if (parts.length !== 3) {
        return error(res, 'Invalid scope format for class assignment', 400, 'INVALID_SCOPE');
      }
      const [department, section, batch_year] = parts;
      filter = { department, section, batch_year: Number(batch_year) };
    }

    const students = await Student.find(filter);
    success(res, students, { total: students.length });
  } catch (err) { next(err); }
});

module.exports = router;
