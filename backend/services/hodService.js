/**
 * services/hodService.js
 * HOD business workflows.
 * Handles dashboard aggregation, user search, and role assignment orchestration.
 */

const studentRepo = require('../repositories/studentRepo');
const skillRepo = require('../repositories/skillRepo');
const certificationRepo = require('../repositories/certificationRepo');
const projectRepo = require('../repositories/projectRepo');
const placementRepo = require('../repositories/placementRepo');
const verificationLogRepo = require('../repositories/verificationLogRepo');
const userRepo = require('../repositories/userRepo');
const facultyRepo = require('../repositories/facultyRepo');
const roleAssignmentRepo = require('../repositories/roleAssignmentRepo');
const classRepo = require('../repositories/classRepo');
const { notifyRoleAssigned } = require('./notification');
const { paginate, buildMeta } = require('../utils/pagination');
const { getClassIds } = require('../utils/classQuery');

/**
 * Assemble the HOD dashboard payload.
 * Runs ~12 parallel/sequential aggregations across multiple collections.
 */
const getDashboard = async () => {
  const totalStudents = await studentRepo.countDocuments();
  const tierDistribution = await studentRepo.aggregate([{ $group: { _id: '$readiness_tier', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  const avgScoreResult = await studentRepo.aggregate([{ $group: { _id: null, avg: { $avg: '$readiness_score' } } }]);
  const avgReadinessScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avg * 100) / 100 : 0;

  const departmentStats = await studentRepo.aggregate([
    { $lookup: { from: 'classes', localField: 'class_id', foreignField: '_id', as: 'class' } },
    { $unwind: '$class' },
    { $group: { _id: '$class.department', count: { $sum: 1 }, avg_score: { $avg: '$readiness_score' }, avg_cgpa: { $avg: '$cgpa' } } },
    { $sort: { avg_score: -1 } }
  ]);

  const pendingSkills = await skillRepo.countDocuments({ status: 'pending' });
  const pendingCerts = await certificationRepo.countDocuments({ status: 'pending' });
  const pendingProjects = await projectRepo.countDocuments({ status: 'pending' });
  const verifiedSkills = await skillRepo.countDocuments({ status: 'verified' });
  const verifiedCerts = await certificationRepo.countDocuments({ status: 'verified' });
  const reviewedProjects = await projectRepo.countDocuments({ status: 'reviewed' });
  const activeDrives = await placementRepo.countDrives({ status: { $in: ['upcoming', 'active'] } });
  const totalApplications = await placementRepo.countApplications();
  const selectedStudents = await placementRepo.countApplications({ status: 'selected' });
  const topStudents = await studentRepo.findAll({}, 'full_name roll_number department readiness_score readiness_tier cgpa').sort({ readiness_score: -1 }).limit(10);
  const activeRoles = await roleAssignmentRepo.countDocuments({ revoked_at: null });
  const topSkills = await skillRepo.aggregate([{ $match: { status: 'verified' } }, { $group: { _id: '$skill_name', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);

  return {
    overview: { total_students: totalStudents, avg_readiness_score: avgReadinessScore, active_drives: activeDrives, active_roles: activeRoles },
    tier_distribution: tierDistribution,
    department_stats: departmentStats.map(d => ({
      department: d._id, count: d.count,
      avg_score: Math.round(d.avg_score * 100) / 100,
      avg_cgpa: Math.round(d.avg_cgpa * 100) / 100
    })),
    verification: {
      pending: { skills: pendingSkills, certifications: pendingCerts, projects: pendingProjects },
      completed: { skills: verifiedSkills, certifications: verifiedCerts, projects: reviewedProjects }
    },
    placement: { active_drives: activeDrives, total_applications: totalApplications, selected_students: selectedStudents },
    top_students: topStudents,
    top_skills: topSkills
  };
};

/**
 * Get paginated student list with optional department/section/batch/tier filters.
 */
const getAllStudents = async (params) => {
  const { department, batch_year, section, tier, page = 1, limit = 50 } = params;
  const filter = {};

  if (department || batch_year || section) {
    const classIds = await getClassIds({
      department,
      batch_year: batch_year ? parseInt(batch_year) : undefined,
      section
    });
    if (classIds.length === 0) {
      return { students: [], meta: buildMeta(0, 1, parseInt(limit)) };
    }
    filter.class_id = { $in: classIds };
  }

  if (tier) filter.readiness_tier = tier;

  const { skip, limit: parsedLimit, page: parsedPage } = paginate(page, limit);
  const total = await studentRepo.countDocuments(filter);
  const students = await studentRepo.findAll(filter)
    .populate('user_id', 'email is_active')
    .sort({ readiness_score: -1 })
    .skip(skip)
    .limit(parsedLimit);

  return { students, meta: buildMeta(total, parsedPage, parsedLimit) };
};

/**
 * Search users (students or faculty) by name/email/id for HOD assignment UI.
 */
const searchUsers = async ({ search, role, limit = 10 }) => {
  if (!search) return [];

  const queryLimit = parseInt(limit);
  const regex = new RegExp(search, 'i');
  const matchingUsers = await userRepo.find({ email: regex }).select('_id');
  const userIds = matchingUsers.map(u => u._id);

  if (role === 'student') {
    const students = await studentRepo.findAll({
      $or: [{ full_name: regex }, { roll_number: regex }, { user_id: { $in: userIds } }]
    }).populate('user_id', 'email').limit(queryLimit);
    return students.map(s => ({
      _id: s.user_id?._id || s.user_id,
      name: s.full_name,
      email: s.user_id?.email || '',
      department: s.department,
      studentId: s._id
    }));
  } else if (role === 'faculty') {
    const faculty = await facultyRepo.find({
      $or: [{ full_name: regex }, { employee_id: regex }, { user_id: { $in: userIds } }]
    }, 0, queryLimit);
    return faculty.map(f => ({
      _id: f.user_id?._id || f.user_id,
      name: f.full_name,
      email: f.user_id?.email || '',
      department: f.department
    }));
  } else {
    const err = new Error('Role must be student or faculty');
    err.statusCode = 400;
    err.code = 'INVALID_ROLE';
    throw err;
  }
};

/**
 * Create a role assignment and notify the assignee.
 * Resolves scope data from class_id if provided.
 */
const createRoleAssignment = async ({ user_id, role, scope_type, scope_id, scope_label, scope_data, class_id, assigned_by }) => {
  const user = await userRepo.findById(user_id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    err.code = 'USER_NOT_FOUND';
    throw err;
  }

  const existing = await roleAssignmentRepo.findOne({ user_id, role, scope_type, scope_label, revoked_at: null });
  if (existing) {
    const err = new Error(`User already has an active ${role} role for ${scope_label}`);
    err.statusCode = 409;
    err.code = 'ROLE_EXISTS';
    throw err;
  }

  let resolvedScopeData = scope_data;
  if (class_id) {
    const classDoc = await classRepo.findById(class_id);
    if (!classDoc) {
      const err = new Error('Class not found');
      err.statusCode = 404;
      err.code = 'CLASS_NOT_FOUND';
      throw err;
    }
    resolvedScopeData = {
      department: classDoc.department,
      section: classDoc.section,
      batch_year: classDoc.batch_year
    };
  }

  const assignment = await roleAssignmentRepo.create({
    user_id,
    role,
    scope_type,
    scope_id: role === 'mentor' ? scope_id : (class_id || scope_id),
    scope_label: scope_label || (resolvedScopeData
      ? `${resolvedScopeData.department}-${resolvedScopeData.section}-${resolvedScopeData.batch_year}`
      : scope_label),
    scope_data: resolvedScopeData,
    class_id: class_id || null,
    assigned_by
  });
  await notifyRoleAssigned(user_id, role, scope_label);

  return assignment;
};

/**
 * Get enriched list of active role assignments (with assignee name).
 */
const getRoleAssignments = async () => {
  const assignments = await roleAssignmentRepo.find({ revoked_at: null })
    .populate('user_id', 'email base_role')
    .sort({ created_at: -1 });

  const enriched = await Promise.all(assignments.map(async (a) => {
    const obj = a.toObject();
    if (a.user_id?.base_role === 'student') {
      const student = await studentRepo.findByUserId(a.user_id._id);
      obj.assignee_name = student ? `${student.full_name} (${student.roll_number})` : a.user_id.email;
    } else {
      const faculty = await facultyRepo.findByUserId(a.user_id._id);
      obj.assignee_name = faculty ? `${faculty.full_name} (${faculty.employee_id})` : a.user_id.email;
    }
    return obj;
  }));

  return enriched;
};

/**
 * Get all classes formatted for HOD dropdown UI.
 */
const getClasses = async () => {
  const classes = await classRepo.find({}).sort({ department: 1, batch_year: 1, section: 1 });
  return classes.map(c => ({
    _id: c._id,
    department: c.department,
    section: c.section,
    batch_year: c.batch_year,
    graduation_year: c.graduation_year,
    academic_year: c.academic_year,
    semester: c.semester,
    is_active: c.is_active,
    label: `${c.department}-${c.section}-${c.batch_year}`
  }));
};

/**
 * Update class semester and trigger SkillRack peer-group recomputation.
 */
const updateClassSemester = async (classId, semester) => {
  const cls = await classRepo.updateById(classId, {
    $set: { semester, academic_year: Math.ceil(semester / 2) }
  });

  if (!cls) {
    const err = new Error('Class not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Trigger recompute for SkillRack peer group
  const { recomputePeerGroup } = require('./skillrackScoring');
  await recomputePeerGroup(cls._id).catch(err =>
    console.error('Failed to recompute peer group after semester update:', err)
  );

  return cls;
};

/**
 * Get paginated verification logs with optional filters.
 */
const getVerificationLogs = async ({ item_type, action, student_id, page = 1, limit = 50 }) => {
  const filter = {};
  if (item_type) filter.item_type = item_type;
  if (action) filter.action = action;
  if (student_id) filter.student_id = student_id;

  const { skip, limit: parsedLimit, page: parsedPage } = paginate(page, limit);
  const total = await verificationLogRepo.countDocuments(filter);
  const logs = await verificationLogRepo.find(filter, skip, parsedLimit);

  return { logs, meta: buildMeta(total, parsedPage, parsedLimit) };
};

module.exports = {
  getDashboard,
  getAllStudents,
  searchUsers,
  createRoleAssignment,
  getRoleAssignments,
  getClasses,
  updateClassSemester,
  getVerificationLogs
};
