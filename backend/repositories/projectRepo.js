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
const { resolveScopeToStudentFilter } = require('../utils/scopeResolver');

const findPending = async (skip = 0, limit = 10, scope = null) => {
  const filter = { status: 'pending' };
  if (scope) {
    const studentFilter = await resolveScopeToStudentFilter(scope);
    if (studentFilter.student_id === null) return [];
    filter.student_ids = studentFilter.student_id;
  }
  return Project.find(filter)
    .skip(skip)
    .limit(limit)
    .populate('student_ids', 'full_name roll_number department')
    .populate('created_by', 'full_name')
    .exec();
};

const countPending = async (scope = null) => {
  const filter = { status: 'pending' };
  if (scope) {
    const studentFilter = await resolveScopeToStudentFilter(scope);
    if (studentFilter.student_id === null) return 0;
    filter.student_ids = studentFilter.student_id;
  }
  return count(filter);
};

module.exports = {
  findMany, findOne, findById, create, updateById, deleteById, count, countDocuments: count,
  findByStudentIds, findByStudentAndId, findReviewedByStudent, findPending, countPending
};
