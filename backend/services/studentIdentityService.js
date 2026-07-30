const userRepo = require('../repositories/userRepo');
const studentRepo = require('../repositories/studentRepo');
const InstitutionSettingsService = require('./institutionSettingsService');

class StudentIdentityService {
  static async resolveByUserId(userId) {
    const user = await userRepo.findById(userId);
    if (!user || user.base_role !== 'student') return null;
    return studentRepo.findByUserId(userId);
  }

  static async resolveByStudentId(studentId) {
    return studentRepo.findById(studentId);
  }

  static async resolveByRollNumber(rollNumber) {
    return studentRepo.findOne({ roll_number: rollNumber });
  }

  static async resolveByRegisterNumber(registerNumber) {
    return studentRepo.findOne({ register_number: registerNumber });
  }

  /**
   * Resolves the student by the active Institution login strategy identifier.
   */
  static async resolveByIdentifier(identifier) {
    const settings = await InstitutionSettingsService.getSettings();
    if (settings.login_strategy === 'EMAIL') {
      const user = await userRepo.findByIdentifier(identifier);
      if (!user) return null;
      return studentRepo.findByUserId(user._id);
    } else if (settings.login_strategy === 'REGISTER_NUMBER') {
      return this.resolveByRegisterNumber(identifier);
    }
    // Default to ROLL_NUMBER
    return this.resolveByRollNumber(identifier);
  }

  static async validateOwnership(userId, targetStudentId) {
    const student = await this.resolveByStudentId(targetStudentId);
    if (!student) return false;
    return student.user_id._id.toString() === userId.toString();
  }
}

module.exports = StudentIdentityService;
