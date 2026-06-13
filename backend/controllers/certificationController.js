// controllers/certificationController.js
const { validationResult } = require('express-validator');
const certificationRepo = require('../repositories/certificationRepo');
const verificationLogRepo = require('../repositories/verificationLogRepo');
const { success, error } = require('../utils/response');

exports.getCertifications = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const certs = await certificationRepo.findByStudentId(req.params.studentId);
    let filtered = certs;
    if (status) filtered = filtered.filter(c => c.status === status);
    if (category) filtered = filtered.filter(c => c.category === category);
    filtered.sort((a, b) => b.created_at - a.created_at);
    success(res, filtered, { total: filtered.length });
  } catch (err) {
    next(err);
  }
};

exports.addCertification = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const cert = await certificationRepo.create({
      student_id: req.params.studentId, ...req.body, status: 'pending'
    });

    await verificationLogRepo.create({
      item_type: 'certification', item_id: cert._id, student_id: req.params.studentId, actor_id: req.user.userId,
      action: 'submitted', comment: `Certification "${req.body.title}" from ${req.body.issuer} submitted`
    });

    success(res, cert, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateCertification = async (req, res, next) => {
  try {
    let cert = await certificationRepo.findByStudentAndId(req.params.studentId, req.params.certId);
    if (!cert) {
      return error(res, 'Certification not found', 404, 'NOT_FOUND');
    }

    if (cert.status === 'verified' || cert.status === 'expired') {
      return error(res, 'Cannot update a verified or expired certification. Submit a new one instead.', 400, 'CANNOT_UPDATE_LOCKED');
    }

    const allowedFields = ['title', 'issuer', 'category', 'issue_date', 'expiry_date', 'credential_id', 'verification_url', 'drive_link'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (cert.status === 'rejected') {
      updateData.status = 'pending';
      updateData.rejection_reason = undefined;
    }

    cert = await certificationRepo.updateById(req.params.certId, updateData);
    success(res, cert);
  } catch (err) {
    next(err);
  }
};

exports.deleteCertification = async (req, res, next) => {
  try {
    const cert = await certificationRepo.findByStudentAndId(req.params.studentId, req.params.certId);
    if (!cert) {
      return error(res, 'Certification not found', 404, 'NOT_FOUND');
    }

    if (cert.status === 'verified') {
      return error(res, 'Cannot delete a verified certification', 400, 'CANNOT_DELETE_VERIFIED');
    }

    await certificationRepo.deleteById(req.params.certId);
    success(res, { message: 'Certification deleted successfully' });
  } catch (err) {
    next(err);
  }
};
