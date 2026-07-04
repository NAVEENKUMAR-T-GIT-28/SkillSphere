// repositories/projectRepo.js
const Project = require('../models/Project');
const { syncStudentSearch } = require('../services/studentSearchSync');

const findByStudentIds = (studentId) => Project.find({ student_ids: studentId });
const findById = (id) => Project.findById(id);
const findByStudentAndId = (studentId, id) => Project.findOne({ _id: id, student_ids: studentId });
const findReviewedByStudent = (studentId) => Project.find({ student_ids: studentId, status: 'reviewed' });
const create = async (data) => {
  const result = await Project.create(data);
  // Fire-and-forget: sync StudentSearch for all team members
  const studentIds = result.student_ids || [];
  for (const sid of studentIds) {
    syncStudentSearch(sid).catch(err => console.error('StudentSearch sync failed:', err));
  }
  return result;
};
const updateById = (id, data) => Project.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = async (id) => {
  const project = await Project.findById(id);
  const result = await Project.findByIdAndDelete(id);
  // Fire-and-forget: sync StudentSearch for all team members after delete
  if (project) {
    const studentIds = project.student_ids || [];
    for (const sid of studentIds) {
      syncStudentSearch(sid).catch(err => console.error('StudentSearch sync failed:', err));
    }
  }
  return result;
};
const findPending = (skip = 0, limit = 10) => Project.find({ status: 'pending' }).skip(skip).limit(limit);
const countDocuments = (filter = {}) => Project.countDocuments(filter);

module.exports = {
  findByStudentIds, findById, findByStudentAndId, findReviewedByStudent,
  create, updateById, deleteById,
  findPending, countDocuments
};
