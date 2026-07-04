// repositories/achievementRepo.js
const Achievement = require('../models/Achievement');

const findByStudentId = (studentId) => Achievement.find({ student_id: studentId });
const findById = (id) => Achievement.findById(id);
const findByStudentAndId = (studentId, id) => Achievement.findOne({ _id: id, student_id: studentId });
const findVerifiedByStudent = (studentId) => Achievement.find({ student_id: studentId, status: 'verified' });
const create = (data) => Achievement.create(data);
const updateById = (id, data) => Achievement.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const updateStatus = (id, status, reviewerId) => Achievement.findByIdAndUpdate(id, { status, verified_by: reviewerId, verified_at: new Date() }, { new: true });
const deleteById = (id) => Achievement.findByIdAndDelete(id);
const findPending = (skip = 0, limit = 10) => Achievement.find({ status: 'pending' }).skip(skip).limit(limit);
const countDocuments = (filter = {}) => Achievement.countDocuments(filter);

module.exports = {
  findByStudentId, findById, findByStudentAndId, findVerifiedByStudent,
  create, updateById, updateStatus, deleteById,
  findPending, countDocuments
};
