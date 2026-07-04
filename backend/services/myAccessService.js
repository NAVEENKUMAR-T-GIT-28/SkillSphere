// services/myAccessService.js
const studentRepo = require('../repositories/studentRepo');
const roleAssignmentRepo = require('../repositories/roleAssignmentRepo');
const { getClassIds } = require('../utils/classQuery');

const getMenteesForUser = async (userId) => {
  const assignments = await roleAssignmentRepo.findMany({
    user_id: userId, role: 'mentor', revoked_at: null
  });
  const studentIds = assignments.map(a => a.scope_id).filter(Boolean);
  if (studentIds.length === 0) return [];
  return await studentRepo.findMany({ _id: { $in: studentIds } });
};

const getClassAccessForUser = async (userId) => {
  const assignment = await roleAssignmentRepo.findOne({
    user_id: userId, role: { $in: ['cc', 'rep'] }, revoked_at: null
  }); // populate('class_id') not strictly needed if we just need the id

  if (!assignment) {
    const err = new Error('No class/section assigned');
    err.statusCode = 403;
    err.code = 'ROLE_NOT_ASSIGNED';
    throw err;
  }

  let filter = {};

  if (assignment.class_id) {
    filter.class_id = assignment.class_id;
  } else {
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
        const err = new Error('Invalid scope format for class assignment');
        err.statusCode = 400;
        err.code = 'INVALID_SCOPE';
        throw err;
      }
    } else {
      const err = new Error('Invalid scope format for class assignment');
      err.statusCode = 400;
      err.code = 'INVALID_SCOPE';
      throw err;
    }

    const classIds = await getClassIds({
      department: queryDept,
      sections: querySec ? [querySec] : undefined,
      batch_years: queryBatch ? [queryBatch] : undefined
    });

    if (classIds.length === 0) {
      return [];
    }
    
    filter.class_id = { $in: classIds };
  }

  return await studentRepo.findMany(filter);
};

module.exports = { getMenteesForUser, getClassAccessForUser };
