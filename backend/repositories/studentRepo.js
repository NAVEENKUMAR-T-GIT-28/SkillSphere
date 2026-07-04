// repositories/studentRepo.js
const Student = require('../models/Student');
const { syncStudentSearch } = require('../services/studentSearchSync');

const findById = (id) => Student.findById(id).populate('user_id', '-password');
const findByUserId = (userId) => Student.findOne({ user_id: userId });
const findAll = (filter = {}, projection = null) => Student.find(filter, projection);
const create = (data) => Student.create(data);
const updateById = async (id, data) => {
  const result = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  // Fire-and-forget: sync StudentSearch after student profile update
  if (result) {
    syncStudentSearch(id).catch(err => console.error('StudentSearch sync failed:', err));
  }
  return result;
};
const deleteById = (id) => Student.findByIdAndDelete(id);
const countDocuments = (filter = {}) => Student.countDocuments(filter);
const aggregate = (pipeline) => Student.aggregate(pipeline);

module.exports = { findById, findByUserId, findAll, create, updateById, deleteById, countDocuments, aggregate };
