// repositories/achievementRepo.js
const Achievement = require('../models/Achievement');

const findMany = (filter = {}, skip = 0, limit = 10) => Achievement.find(filter).skip(skip).limit(limit);
const findOne = (filter) => Achievement.findOne(filter);
const findById = (id) => Achievement.findById(id);
const create = (data) => Achievement.create(data);
const updateById = (id, data) => Achievement.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = (id) => Achievement.findByIdAndDelete(id);
const count = (filter = {}) => Achievement.countDocuments(filter);

const findByStudentId = (studentId) => findMany({ student_id: studentId }, 0, 100);
const findByStudentAndId = (studentId, id) => findOne({ _id: id, student_id: studentId });
const findVerifiedByStudent = (studentId) => findMany({ student_id: studentId, status: 'verified' }, 0, 100);
const updateStatus = (id, status, reviewerId) => updateById(id, { status, verified_by: reviewerId, verified_at: new Date() });
const { resolveScopeToStudentFilter } = require('../utils/scopeResolver');

const findPending = async (skip = 0, limit = 10, scope = null) => {
  const filter = { status: 'pending' };
  if (scope) {
    const studentFilter = await resolveScopeToStudentFilter(scope);
    if (studentFilter.student_id === null) return [];
    Object.assign(filter, studentFilter);
  }
  return Achievement.find(filter)
    .skip(skip)
    .limit(limit)
    .populate('student_id', 'full_name roll_number department')
    .exec();
};

const countPending = async (scope = null) => {
  const filter = { status: 'pending' };
  if (scope) {
    const studentFilter = await resolveScopeToStudentFilter(scope);
    if (studentFilter.student_id === null) return 0;
    Object.assign(filter, studentFilter);
  }
  return count(filter);
};

module.exports = {
  findMany, findOne, findById, create, updateById, deleteById, count, countDocuments: count,
  findByStudentId, findByStudentAndId, findVerifiedByStudent, updateStatus, findPending, countPending
};
