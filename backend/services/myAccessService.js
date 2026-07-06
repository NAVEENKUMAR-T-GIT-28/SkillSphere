// services/myAccessService.js
const studentRepo = require('../repositories/studentRepo');
const roleAssignmentRepo = require('../repositories/roleAssignmentRepo');
const studentSearchRepo = require('../repositories/studentSearchRepo');

// Models for aggregation
const Skill = require('../models/Skill');
const Certification = require('../models/Certification');
const Project = require('../models/Project');
const Internship = require('../models/Internship');
const Achievement = require('../models/Achievement');

const { getClassIds } = require('../utils/classQuery');

const getMenteesForUser = async (userId, userFullName = 'Mentor', queryParams = {}) => {
  const assignments = await roleAssignmentRepo.findMany({
    user_id: userId, role: 'mentor', revoked_at: null
  });
  
  const resolvedStudentIds = [];
  const classIds = [];

  for (const assignment of assignments) {
    if (assignment.scope_type === 'student' && assignment.scope_id) {
      resolvedStudentIds.push(assignment.scope_id);
    } else if ((assignment.scope_type === 'class' || assignment.scope_type === 'section') && assignment.class_id) {
      classIds.push(assignment.class_id);
    }
  }

  if (classIds.length > 0) {
    const classStudents = await studentRepo.findMany({ class_id: { $in: classIds } }).select('_id');
    classStudents.forEach(s => resolvedStudentIds.push(s._id));
  }

  // Remove duplicates just in case
  const studentIds = [...new Set(resolvedStudentIds.map(id => id.toString()))];

  if (studentIds.length === 0) {
    return {
      summary: { total_mentees: 0, placement_ready: 0, needs_attention: 0, average_readiness: null, average_ats: null },
      pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      items: []
    };
  }

  // Pagination (Optional from backend as per user request, defaulting to high limit for client-side)
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 1000;
  const skip = (page - 1) * limit;

  // Primary Source: Identity and Academic
  const baseStudents = await studentRepo.findMany({ _id: { $in: studentIds } })
    .skip(skip)
    .limit(limit);
  
  const paginatedStudentIds = baseStudents.map(s => s._id);

  // Enrichment: StudentSearch for portfolio counts, placements, ATS
  const searchDocs = await studentSearchRepo.findMany({ student_id: { $in: paginatedStudentIds } });
  const searchMap = searchDocs.reduce((acc, doc) => {
    acc[doc.student_id.toString()] = doc;
    return acc;
  }, {});

  // Fetch pending verifications via parallel aggregations
  const getPendingCounts = async (Model, type) => {
    return await Model.aggregate([
      { $match: { student_id: { $in: paginatedStudentIds }, status: 'pending' } },
      { $group: { _id: '$student_id', count: { $sum: 1 }, latest: { $max: '$created_at' } } } // 'created_at' may vary or not exist, we just need count
    ]);
  };

  const [skillsP, certsP, projectsP, internshipsP, achievementsP] = await Promise.all([
    getPendingCounts(Skill, 'skill'),
    getPendingCounts(Certification, 'certification'),
    getPendingCounts(Project, 'project'),
    getPendingCounts(Internship, 'internship'),
    getPendingCounts(Achievement, 'achievement')
  ]);

  const mergeCounts = (results) => {
    const map = {};
    results.forEach(res => {
      res.forEach(row => {
        const sid = row._id.toString();
        map[sid] = (map[sid] || 0) + row.count;
      });
    });
    return map;
  };
  const pendingMap = mergeCounts([skillsP, certsP, projectsP, internshipsP, achievementsP]);

  // Construct items
  let placementReadyCount = 0;
  let needsAttentionCount = 0;

  const items = baseStudents.map(student => {
    const sid = student._id.toString();
    const searchData = searchMap[sid] || {};
    
    const isReady = searchData.is_placed || searchData.placement_status === 'Ready' || searchData.readiness_tier === 'placement_ready' || searchData.readiness_tier === 'industry_ready';
    if (isReady) placementReadyCount++;
    if (searchData.readiness_tier === 'beginner' || student.cgpa < 6.0) needsAttentionCount++;

    return {
      student_id: sid,
      user_id: student.user_id,
      identity: {
        full_name: student.full_name,
        roll_number: student.roll_number,
        avatar: student.profile_photo_url || null
      },
      academic: {
        department: student.department || 'N/A',
        section: student.section || 'N/A',
        semester: student.semester || 1,
        batch: student.batch_year || 0,
        cgpa: student.cgpa || 0
      },
      portfolio: {
        skills: searchData.verified_skills?.length || 0,
        certifications: searchData.verified_certifications?.length || 0,
        projects: searchData.project_count || 0,
        internships: searchData.internship_count || 0,
        achievements: 0 // Not synced to StudentSearch yet
      },
      verification: {
        pending: pendingMap[sid] || 0
      },
      coding: {
        platforms: searchData.coding_platforms || []
      },
      resume: {
        uploaded: !!searchData.resume_ats_score,
        ats_score: null // TODO: Future ATS Engine
      },
      readiness: {
        score: null, // TODO: Future Readiness Engine
        tier: null   // TODO: Future Readiness Engine
      },
      activity: {
        latest_submission: searchData.synced_at || null,
        latest_submission_date: searchData.synced_at || null
      },
      mentor: {
        mentor_name: userFullName
      }
    };
  });

  return {
    summary: {
      total_mentees: studentIds.length,
      placement_ready: placementReadyCount, // Only counts paginated window if limit is small, but we use limit 1000 usually
      needs_attention: needsAttentionCount,
      average_readiness: null, // TODO
      average_ats: null // TODO
    },
    pagination: {
      page,
      limit,
      total: studentIds.length,
      pages: Math.ceil(studentIds.length / limit)
    },
    items
  };
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
