// utils/scopeResolver.js
const studentSearchRepo = require('../repositories/studentSearchRepo');

/**
 * Resolves an authorization scope (which may contain department or class_id filters)
 * into a flat student_id filter for models that only have a student_id reference.
 */
const resolveScopeToStudentFilter = async (scope) => {
  if (!scope || scope.student_id === null) {
    return { student_id: null };
  }

  // If the scope is already just a list of student_ids without department/class, we could optimize,
  // but running it through StudentSearch is fast and guarantees we only match valid students.
  const students = await studentSearchRepo.find(scope).select('student_id');
  const studentIds = students.map(s => s.student_id);

  if (studentIds.length === 0) {
    return { student_id: null };
  }

  return { student_id: { $in: studentIds } };
};

module.exports = { resolveScopeToStudentFilter };
