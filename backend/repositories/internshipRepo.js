// repositories/internshipRepo.js
const Internship = require('../models/Internship');

const findMany = (filter = {}, skip = 0, limit = 10) => Internship.find(filter).skip(skip).limit(limit);
const findOne = (filter) => Internship.findOne(filter);
const findById = (id) => Internship.findById(id);
const create = (data) => Internship.create(data);
const updateById = (id, data) => Internship.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = (id) => Internship.findByIdAndDelete(id);
const count = (filter = {}) => Internship.countDocuments(filter);

const findByStudentId = (studentId) => findMany({ student_id: studentId }, 0, 100);
const findByStudentAndId = (studentId, id) => findOne({ _id: id, student_id: studentId });
const findVerifiedByStudent = (studentId) => findMany({ student_id: studentId, status: 'verified' }, 0, 100);
const updateStatus = (id, status, reviewerId) => updateById(id, { status, verified_by: reviewerId, verified_at: new Date() });
const findPending = (skip = 0, limit = 10) => findMany({ status: 'pending' }, skip, limit);

module.exports = {
  findMany, findOne, findById, create, updateById, deleteById, count, countDocuments: count,
  findByStudentId, findByStudentAndId, findVerifiedByStudent, updateStatus, findPending
};
