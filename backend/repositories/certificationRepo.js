// repositories/certificationRepo.js
const Certification = require('../models/Certification');

const findMany = (filter = {}, skip = 0, limit = 10) => Certification.find(filter).skip(skip).limit(limit);
const findOne = (filter) => Certification.findOne(filter);
const findById = (id) => Certification.findById(id);
const create = (data) => Certification.create(data);
const updateById = (id, data) => Certification.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = (id) => Certification.findByIdAndDelete(id);
const count = (filter = {}) => Certification.countDocuments(filter);

const findByStudentId = (studentId) => findMany({ student_id: studentId }, 0, 100);
const findByStudentAndId = (studentId, id) => findOne({ _id: id, student_id: studentId });
const findVerifiedByStudent = (studentId) => findMany({ student_id: studentId, status: 'verified' }, 0, 100);
const updateStatus = (id, status, reviewerId) => updateById(id, { status, verified_by: reviewerId, verified_at: new Date() });
const findPending = (skip = 0, limit = 10) => findMany({ status: 'pending' }, skip, limit);

module.exports = {
  findMany, findOne, findById, create, updateById, deleteById, count, countDocuments: count,
  findByStudentId, findByStudentAndId, findVerifiedByStudent, updateStatus, findPending
};
