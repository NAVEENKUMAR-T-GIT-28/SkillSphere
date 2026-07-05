const { validationResult } = require('express-validator');
const studentRepo = require('../../repositories/studentRepo');
const ProfileService = require('../../services/profile/profile.service');
const ProfileUpdateService = require('../../services/profile/profileUpdate.service');
const { success, error } = require('../../utils/response');

/**
 * Resolves the student document for the currently authenticated user.
 */
async function resolveStudent(req, res) {
  const targetId = req.query.studentId;
  if (targetId) {
    const student = await studentRepo.findById(targetId);
    if (!student) { error(res, 'Student not found', 404, 'NOT_FOUND'); return null; }
    return student;
  }
  const student = await studentRepo.findByUserId(req.user.userId);
  if (!student) { error(res, 'Student profile not found for this user', 404, 'NOT_FOUND'); return null; }
  return student;
}

class ProfileController {

  static async getProfile(req, res, next) {
    try {
      const student = await resolveStudent(req, res);
      if (!student) return;

      const profileData = await ProfileService.getCompleteProfile(student._id);
      success(res, profileData);
    } catch (err) {
      if (err.statusCode) return error(res, err.message, err.statusCode, err.code);
      next(err);
    }
  }

  static async updateBasic(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');

      const student = await resolveStudent(req, res);
      if (!student) return;

      await ProfileUpdateService.updateBasic(student._id, req.body);
      const profileData = await ProfileService.getCompleteProfile(student._id);
      success(res, profileData);
    } catch (err) { next(err); }
  }

  static async updateAcademic(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');

      const student = await resolveStudent(req, res);
      if (!student) return;

      await ProfileUpdateService.updateAcademic(student._id, req.body);
      const profileData = await ProfileService.getCompleteProfile(student._id);
      success(res, profileData);
    } catch (err) { next(err); }
  }

  static async updateCareer(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');

      const student = await resolveStudent(req, res);
      if (!student) return;

      await ProfileUpdateService.updateCareer(student._id, req.body);
      const profileData = await ProfileService.getCompleteProfile(student._id);
      success(res, profileData);
    } catch (err) { next(err); }
  }

  static async updateSocial(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');

      const student = await resolveStudent(req, res);
      if (!student) return;

      await ProfileUpdateService.updateSocial(student._id, req.body);
      const profileData = await ProfileService.getCompleteProfile(student._id);
      success(res, profileData);
    } catch (err) { next(err); }
  }
}

module.exports = ProfileController;
