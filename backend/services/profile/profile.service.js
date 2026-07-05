const studentRepo = require('../../repositories/studentRepo');
const codingProfileRepo = require('../../repositories/codingProfileRepo');
const resumeRepo = require('../../repositories/resumeRepo');
const ProfileStatisticsService = require('./profileStatistics.service');
const ProfileCompletionService = require('./profileCompletion.service');
const ProfileDTO = require('../../dto/profile.dto');

class ProfileService {
  /**
   * Orchestrates the aggregation of all profile data and returns the DTO.
   */
  static async getCompleteProfile(studentId) {
    const student = await studentRepo.findById(studentId);
    if (!student) {
      const err = new Error('Student not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // user_id is populated by studentRepo.findById
    const user = student.user_id;

    // Parallel fetch of related data
    const [codingProfile, latestResume] = await Promise.all([
      codingProfileRepo.findByStudentId(studentId).catch(() => null),
      resumeRepo.findLatestByStudentId(studentId).catch(() => null)
    ]);

    // Statistics
    const statistics = await ProfileStatisticsService.getStatistics(studentId, student);

    // Completion (pass raw resume doc — service checks truthiness, not .uploaded)
    const links = student.links || {};
    const completionData = ProfileCompletionService.calculateCompletion(student, latestResume, links);

    return ProfileDTO.format(student, user, latestResume, statistics, completionData, codingProfile);
  }
}

module.exports = ProfileService;
