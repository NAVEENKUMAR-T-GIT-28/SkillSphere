// controllers/internshipController.js
const { validationResult } = require('express-validator');
const internshipRepo = require('../repositories/internshipRepo');
const verificationLogRepo = require('../repositories/verificationLogRepo');
const { success, error } = require('../utils/response');

exports.getInternships = async (req, res, next) => {
  try {
    const { status } = req.query;
    const internships = await internshipRepo.findByStudentId(req.params.studentId);
    let filtered = internships;
    if (status) filtered = filtered.filter(i => i.status === status);
    filtered.sort((a, b) => b.created_at - a.created_at);
    success(res, filtered, { total: filtered.length });
  } catch (err) {
    next(err);
  }
};

exports.addInternship = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const internship = await internshipRepo.create({
      student_id: req.params.studentId, ...req.body, status: 'pending'
    });

    await verificationLogRepo.create({
      item_type: 'internship', item_id: internship._id, student_id: req.params.studentId, actor_id: req.user.userId,
      action: 'submitted', comment: `Internship "${req.body.role}" at ${req.body.company} submitted`
    });

    success(res, internship, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateInternship = async (req, res, next) => {
  try {
    let internship = await internshipRepo.findByStudentAndId(req.params.studentId, req.params.internshipId);
    if (!internship) {
      return error(res, 'Internship not found', 404, 'NOT_FOUND');
    }

    if (internship.status === 'verified') {
      return error(res, 'Cannot update a verified internship. Submit a new one instead.', 400, 'CANNOT_UPDATE_LOCKED');
    }

    const allowedFields = ['company', 'role', 'internship_type', 'location', 'start_date', 'end_date', 'duration_months', 'stipend', 'certificate_url', 'offer_letter_url', 'description', 'company_logo_url'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (internship.status === 'rejected') {
      updateData.status = 'pending';
      updateData.rejection_reason = undefined;
    }

    internship = await internshipRepo.updateById(req.params.internshipId, updateData);
    success(res, internship);
  } catch (err) {
    next(err);
  }
};

exports.deleteInternship = async (req, res, next) => {
  try {
    const internship = await internshipRepo.findByStudentAndId(req.params.studentId, req.params.internshipId);
    if (!internship) {
      return error(res, 'Internship not found', 404, 'NOT_FOUND');
    }

    if (internship.status === 'verified') {
      return error(res, 'Cannot delete a verified internship', 400, 'CANNOT_DELETE_VERIFIED');
    }

    await internshipRepo.deleteById(req.params.internshipId);
    success(res, { message: 'Internship deleted successfully' });
  } catch (err) {
    next(err);
  }
};
