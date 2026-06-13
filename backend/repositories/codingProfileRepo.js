// repositories/codingProfileRepo.js
const CodingProfile = require('../models/CodingProfile');

const findByStudentId = (studentId) => CodingProfile.find({ student_id: studentId });
const create = (data) => CodingProfile.create(data);
const updateById = (id, data) => CodingProfile.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = (id) => CodingProfile.findByIdAndDelete(id);

module.exports = { findByStudentId, create, updateById, deleteById };
