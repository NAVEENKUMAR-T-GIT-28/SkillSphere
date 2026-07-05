const projectRepo = require('../../repositories/projectRepo');
const skillRepo = require('../../repositories/skillRepo');
const resumeRepo = require('../../repositories/resumeRepo');

class ProfileStatisticsService {
  /**
   * Generates complete statistics for a student.
   * @param {ObjectId} studentId 
   * @param {Object} student - The student document (to get CGPA)
   * @returns {Object} Statistics DTO block
   */
  static async getStatistics(studentId, student) {
    const [projectCount, skillCount, latestResume] = await Promise.all([
      projectRepo.count({ student_id: studentId }),
      skillRepo.count({ student_id: studentId }),
      resumeRepo.findLatestByStudentId(studentId)
    ]);

    return {
      cgpa: student?.cgpa || null,
      projects: projectCount,
      skills: skillCount,
      resume_uploaded: latestResume ? true : false,
      ats_score: latestResume?.ats_score || null
    };
  }
}

module.exports = ProfileStatisticsService;
