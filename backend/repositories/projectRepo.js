// repositories/projectRepo.js
const Project = require('../models/Project');

const findById = (id) => Project.findById(id);
const findOne = (filter) => Project.findOne(filter);
const findMany = (filter = {}, skip = 0, limit = 10) => Project.find(filter).skip(skip).limit(limit);
const count = (filter = {}) => Project.countDocuments(filter);

const create = (data) => Project.create(data);
const updateById = (id, data) => Project.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = (id) => Project.findByIdAndDelete(id);

const findByStudentIds = (studentId) => findMany({ student_ids: studentId }, 0, 100);
const findByStudentAndId = (studentId, id) => findOne({ _id: id, student_ids: studentId });
const findReviewedByStudent = (studentId) => findMany({ student_ids: studentId, status: 'reviewed' }, 0, 100);
const findPending = (skip = 0, limit = 10) => findMany({ status: 'pending' }, skip, limit);

module.exports = {
  findMany, findOne, findById, create, updateById, deleteById, count, countDocuments: count,
  findByStudentIds, findByStudentAndId, findReviewedByStudent, findPending
};
