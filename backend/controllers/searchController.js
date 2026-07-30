// controllers/searchController.js
const { searchStudentsV2 } = require('../services/search');
const { success } = require('../utils/response');

const toSearchDTO = (doc) => ({
  id: doc.identity?.student_id || doc._id,
  identity: {
    student_id: doc.identity?.student_id,
    full_name: doc.identity?.full_name,
    roll_number: doc.identity?.roll_number,
    avatar: doc.identity?.avatar
  },
  class: {
    id: doc.class?.id,
    department: doc.class?.department,
    current_year: doc.class?.current_year,
    section: doc.class?.section,
    display_name: doc.class?.display_name
  },
  academic: {
    cgpa: doc.academic?.cgpa || 0,
    active_backlogs: doc.academic?.active_backlogs || 0
  },
  coding: doc.coding,
  ats: doc.ats,
  portfolio: doc.portfolio,
  mentor: doc.mentor,
  placement: doc.placement,
  verification: doc.verification,
  last_synced: doc.last_synced
});

exports.searchStudentsV2 = async (req, res, next) => {
  try {
    const { students, meta } = await searchStudentsV2(req.query);
    const dtos = students.map(toSearchDTO);
    success(res, dtos, meta);
  } catch (err) {
    next(err);
  }
};

// Aliased for V1 backwards compatibility until frontend fully migrates
exports.searchStudents = exports.searchStudentsV2;
