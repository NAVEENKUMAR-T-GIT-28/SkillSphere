// repositories/internshipRepo.js
const Internship = require('../models/Internship');

const findByStudentId = (studentId) => Internship.find({ student_id: studentId });
const findById = (id) => Internship.findById(id);
const findByStudentAndId = (studentId, id) => Internship.findOne({ _id: id, student_id: studentId });
const findVerifiedByStudent = (studentId) => Internship.find({ student_id: studentId, status: 'verified' });
const create = (data) => Internship.create(data);
const updateById = (id, data) => Internship.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const updateStatus = (id, status, reviewerId) => Internship.findByIdAndUpdate(id, { status, verified_by: reviewerId, verified_at: new Date() }, { new: true });
const deleteById = (id) => Internship.findByIdAndDelete(id);
const findPending = (skip = 0, limit = 10) => Internship.find({ status: 'pending' }).skip(skip).limit(limit);
const countDocuments = (filter = {}) => Internship.countDocuments(filter);

module.exports = {
  findByStudentId, findById, findByStudentAndId, findVerifiedByStudent,
  create, updateById, updateStatus, deleteById,
  findPending, countDocuments
};
