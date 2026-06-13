// repositories/projectRepo.js
const Project = require('../models/Project');

const findByStudentIds = (studentId) => Project.find({ student_ids: studentId });
const findById = (id) => Project.findById(id);
const findByStudentAndId = (studentId, id) => Project.findOne({ _id: id, student_ids: studentId });
const findReviewedByStudent = (studentId) => Project.find({ student_ids: studentId, status: 'reviewed' });
const create = (data) => Project.create(data);
const updateById = (id, data) => Project.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = (id) => Project.findByIdAndDelete(id);
const findPending = (skip = 0, limit = 10) => Project.find({ status: 'pending' }).skip(skip).limit(limit);
const countDocuments = (filter = {}) => Project.countDocuments(filter);

module.exports = {
  findByStudentIds, findById, findByStudentAndId, findReviewedByStudent,
  create, updateById, deleteById,
  findPending, countDocuments
};
