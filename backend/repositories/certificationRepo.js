// repositories/certificationRepo.js
const Certification = require('../models/Certification');

const findByStudentId = (studentId) => Certification.find({ student_id: studentId });
const findById = (id) => Certification.findById(id);
const findByStudentAndId = (studentId, id) => Certification.findOne({ _id: id, student_id: studentId });
const findVerifiedByStudent = (studentId) => Certification.find({ student_id: studentId, status: 'verified' });
const create = (data) => Certification.create(data);
const updateById = (id, data) => Certification.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const updateStatus = (id, status, reviewerId) => Certification.findByIdAndUpdate(id, { status, verified_by: reviewerId, verified_at: new Date() }, { new: true });
const deleteById = (id) => Certification.findByIdAndDelete(id);
const findPending = (skip = 0, limit = 10) => Certification.find({ status: 'pending' }).skip(skip).limit(limit);
const countDocuments = (filter = {}) => Certification.countDocuments(filter);

module.exports = {
  findByStudentId, findById, findByStudentAndId, findVerifiedByStudent,
  create, updateById, updateStatus, deleteById,
  findPending, countDocuments
};
