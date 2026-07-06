// services/authorization.js
const facultyRepo = require('../repositories/facultyRepo');
const studentRepo = require('../repositories/studentRepo');
const roleAssignmentRepo = require('../repositories/roleAssignmentRepo');
const User = require('../models/User');

/**
 * Builds an authorization scope object for a given user.
 * Returns a MongoDB query filter that can be executed against Student or StudentSearch models.
 * If the user has no access, it returns a filter guaranteed to match nothing.
 */
const buildVerificationScope = async (userId) => {
  const user = await User.findById(userId);
  if (!user || (user.base_role !== 'hod' && user.base_role !== 'faculty')) {
    return { student_id: null }; // No access
  }

  const scope = { $or: [] };

  // 1. HOD gets their entire department
  if (user.base_role === 'hod') {
    const faculty = await facultyRepo.findByUserId(userId);
    if (faculty && faculty.department) {
      scope.$or.push({ department: faculty.department });
    }
  }

  // 2. Mentors get their assigned classes/sections/students
  const assignments = await roleAssignmentRepo.findMany({
    user_id: userId,
    role: 'mentor',
    revoked_at: null
  });

  if (assignments.length > 0) {
    const studentIds = [];
    const classIds = [];
    for (const assignment of assignments) {
      if (assignment.scope_type === 'student') {
        studentIds.push(assignment.scope_id);
      } else if (assignment.scope_type === 'class' || assignment.scope_type === 'section') {
        classIds.push(assignment.class_id);
      }
    }
    if (studentIds.length > 0) scope.$or.push({ student_id: { $in: studentIds } });
    if (classIds.length > 0) scope.$or.push({ class_id: { $in: classIds } });
  }

  if (scope.$or.length === 0) {
    return { student_id: null }; // Fallback for no access
  }

  return scope;
};

/**
 * Checks if a user is allowed to verify a specific student.
 */
const verifyVerificationPermission = async (userId, studentId) => {
  const scope = await buildVerificationScope(userId);
  
  if (scope.student_id === null) {
    return { allowed: false, reason: 'Not authorized to verify any students.' };
  }

  const student = await studentRepo.findById(studentId).populate('class_id');
  if (!student) {
    return { allowed: false, reason: 'Student not found.' };
  }

  let allowed = false;

  for (const condition of scope.$or || []) {
    if (condition.department && student.class_id?.department === condition.department) {
      allowed = true;
      break;
    }
    if (condition.class_id && condition.class_id.$in) {
      if (condition.class_id.$in.some(id => id.toString() === student.class_id?._id.toString())) {
        allowed = true;
        break;
      }
    }
    if (condition.student_id && condition.student_id.$in) {
      if (condition.student_id.$in.some(id => id.toString() === studentId.toString())) {
        allowed = true;
        break;
      }
    }
  }

  if (allowed) {
    return { allowed: true, reason: null };
  }
  
  return { allowed: false, reason: 'You are not assigned as a mentor or HOD for this student.' };
};

module.exports = {
  buildVerificationScope,
  verifyVerificationPermission
};
