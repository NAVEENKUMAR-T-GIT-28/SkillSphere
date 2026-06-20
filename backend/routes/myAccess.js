const express = require('express');
const Student = require('../models/Student');
const RoleAssignment = require('../models/RoleAssignment');
const Class = require('../models/Class');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { success, error } = require('../utils/response');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/my');

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
    }).populate('class_id');

    if (!assignment) {
      return error(res, 'No class/section assigned', 403, 'ROLE_NOT_ASSIGNED');
    }

    let filter = {};

    // Preferred path: use class_id reference
    if (assignment.class_id) {
      filter.class_id = assignment.class_id._id;
    }
    // Fallback: use structured scope_data or legacy scope_label
    else {
      let queryDept, querySec, queryBatch;
      
      if (assignment.scope_data && assignment.scope_data.department) {
        queryDept = assignment.scope_data.department;
        querySec = assignment.scope_data.section;
        queryBatch = assignment.scope_data.batch_year;
      } else if (assignment.scope_label) {
        const parts = assignment.scope_label.split('-');
        if (parts.length === 3) {
          [queryDept, querySec, queryBatch] = parts;
          queryBatch = Number(queryBatch);
        } else {
          return error(res, 'Invalid scope format for class assignment', 400, 'INVALID_SCOPE');
        }
      } else {
        return error(res, 'Invalid scope format for class assignment', 400, 'INVALID_SCOPE');
      }

      const { getClassIds } = require('../utils/classQuery');
      const classIds = await getClassIds({
        department: queryDept,
        sections: querySec ? [querySec] : undefined,
        batch_years: queryBatch ? [queryBatch] : undefined
      });

      if (classIds.length === 0) {
        return success(res, [], { total: 0 });
      }
      
      filter.class_id = { $in: classIds };
    }

    const students = await Student.find(filter);
    success(res, students, { total: students.length });
  } catch (err) { next(err); }
});

module.exports = router;
