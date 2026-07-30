const studentSearchRepo = require('../../repositories/studentSearchRepo');
const classRepo = require('../../repositories/classRepo');
const { paginate, buildMeta } = require('../../utils/pagination');

class StudentWorkspaceQueryService {

  /**
   * getWorkspaceSummary
   * Returns the unified DTO required by the frontend Class Workspace.
   */
  static async getWorkspaceSummary(classId, page = 1, limit = 10, search = '', status = '') {
    const classStats = await this.getClassStatistics(classId);
    if (!classStats) return null; // Class doesn't exist in projections yet

    const { students, meta } = await this.getStudentsByClass(classId, page, limit, search, status);

    return {
      workspace: {
        class: classStats.classInfo,
        stats: classStats.stats,
        students,
        pagination: meta,
        filters: { search, status }
      }
    };
  }

  /**
   * getStudentsByClass
   * Paginated list of students in a class.
   */
  static async getStudentsByClass(classId, page, limit, search, status) {
    const filter = { 'class.id': classId };
    
    if (status) {
      filter['academic.academic_status'] = status;
    }
    
    if (search) {
      filter.$or = [
        { 'identity.full_name': { $regex: search, $options: 'i' } },
        { 'identity.roll_number': { $regex: search, $options: 'i' } },
        { 'identity.register_number': { $regex: search, $options: 'i' } }
      ];
    }

    const { skip, limit: parsedLimit, page: parsedPage } = paginate(page, limit);
    const total = await studentSearchRepo.countDocuments(filter);
    
    const students = await studentSearchRepo.find(filter, { skip, limit: parsedLimit, sort: { 'identity.full_name': 1 } });

    return {
      students,
      meta: buildMeta(total, parsedPage, parsedLimit)
    };
  }

  /**
   * getStudentWorkspace
   * Returns detailed projection for a single student.
   */
  static async getStudentWorkspace(studentId) {
    const student = await studentSearchRepo.findByStudent(studentId);
    return student;
  }

  /**
   * searchStudents
   * Full search wrapper mapped directly to CQRS projections.
   */
  static async searchStudents(params) {
    const {
      cgpa_min, cgpa_max, department, section, year, tier, name,
      roll_number, projects_min, internships_min, 
      coding_platforms, has_resume,
      page = 1, limit = 20, sort_by = 'portfolio.completion', sort_order = 'desc'
    } = params;

    const filter = {};

    if (cgpa_min || cgpa_max) {
      filter['academic.cgpa'] = {};
      if (cgpa_min) filter['academic.cgpa'].$gte = parseFloat(cgpa_min);
      if (cgpa_max) filter['academic.cgpa'].$lte = parseFloat(cgpa_max);
    }

    if (department) filter['class.department'] = department;
    
    if (section) {
      const sections = section.split(',').map(s => s.trim()).filter(Boolean);
      filter['class.section'] = sections.length > 1 ? { $in: sections } : sections[0];
    }
    
    if (year) {
      const years = year.split(',').map(Number).filter(Boolean);
      filter['class.current_year'] = years.length > 1 ? { $in: years } : years[0];
    }

    if (tier) {
      const tiers = tier.split(',').map(t => t.trim()).filter(Boolean);
      filter['mentor.readiness_tier'] = tiers.length > 1 ? { $in: tiers } : tiers[0];
    }

    if (name) filter['identity.full_name'] = { $regex: name, $options: 'i' };
    if (roll_number) filter['identity.roll_number'] = { $regex: roll_number, $options: 'i' };

    if (projects_min && parseInt(projects_min) > 0) {
      filter['portfolio.project_count'] = { $gte: parseInt(projects_min) };
    }

    if (internships_min && parseInt(internships_min) > 0) {
      filter['portfolio.internship_count'] = { $gte: parseInt(internships_min) };
    }

    if (coding_platforms) {
      // Assuming coding platforms exist inside coding object or we just check if it exists
      const platforms = coding_platforms.split(',').map(s => s.trim()).filter(Boolean);
      // For Phase B2 MVP: checking if coding.platforms array contains these
      filter['coding.platforms'] = { $in: platforms };
    }

    if (has_resume === 'true' || has_resume === true) {
      filter['ats.has_resume'] = true;
    }

    let sortKey = sort_by;
    // Map legacy sort keys if they still use them
    if (sort_by === 'readiness_score') sortKey = 'mentor.readiness_score';
    
    const sortObj = {};
    sortObj[sortKey] = sort_order === 'asc' ? 1 : -1;

    const { skip, limit: parsedLimit, page: parsedPage } = paginate(page, limit);
    const total = await studentSearchRepo.countDocuments(filter);
    
    const students = await studentSearchRepo.find(filter, { skip, limit: parsedLimit, sort: sortObj });

    return { students, meta: buildMeta(total, parsedPage, parsedLimit) };
  }

  /**
   * getClassStatistics
   * Aggregates stats directly from the projection layer (StudentSearch).
   */
  static async getClassStatistics(classId) {
    const classDoc = await classRepo.findById(classId);
    if (!classDoc) return null;

    const mongoose = require('mongoose');
    const pipeline = [
      { $match: { 'class.id': new mongoose.Types.ObjectId(classId) } },
      {
        $group: {
          _id: '$class.id',
          totalStudents: { $sum: 1 },
          activeStudents: {
            $sum: { $cond: [{ $eq: ['$academic.academic_status', 'ENROLLED'] }, 1, 0] }
          },
          verifiedStudents: {
            $sum: { $cond: [{ $eq: ['$verification.is_verified', true] }, 1, 0] }
          },
          placementEligible: {
            $sum: { $cond: [{ $eq: ['$placement.is_eligible', true] }, 1, 0] }
          },
          avgAtsScore: { $avg: '$ats.score' },
          avgCodingScore: { $avg: '$coding.score' },
          avgCgpa: { $avg: '$academic.cgpa' },
          avgProfileCompletion: { $avg: '$portfolio.completion' }
        }
      }
    ];

    const result = await studentSearchRepo.aggregate(pipeline);
    
    // Map the classDoc properly
    const classInfo = {
      id: classDoc._id.toString(),
      department: classDoc.department,
      batch_start: classDoc.batch_start,
      batch_end: classDoc.batch_end,
      current_year: classDoc.current_year,
      current_semester: classDoc.current_semester,
      section: classDoc.section,
      display_name: classDoc.display_name,
      status: classDoc.status,
      capacity: classDoc.capacity
    };
    
    if (!result || result.length === 0) {
      // Return 0s for an empty class instead of null
      return {
        classInfo,
        stats: {
          total_students: 0,
          active_students: 0,
          verified_students: 0,
          placement_eligible: 0,
          avg_ats: 0,
          avg_coding: 0,
          avg_cgpa: 0,
          avg_profile_completion: 0
        }
      };
    }
    
    const data = result[0];
    return {
      classInfo,
      stats: {
        total_students: data.totalStudents,
        active_students: data.activeStudents,
        verified_students: data.verifiedStudents,
        placement_eligible: data.placementEligible,
        avg_ats: Math.round(data.avgAtsScore || 0),
        avg_coding: Math.round(data.avgCodingScore || 0),
        avg_cgpa: data.avgCgpa ? Number(data.avgCgpa.toFixed(2)) : 0,
        avg_profile_completion: Math.round(data.avgProfileCompletion || 0)
      }
    };
  }
}

module.exports = StudentWorkspaceQueryService;
