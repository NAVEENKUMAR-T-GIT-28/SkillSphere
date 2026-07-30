const AcademicRecord = require('../models/AcademicRecord');

const create = (data, options = {}) => AcademicRecord.create(Array.isArray(data) ? data : [data], options).then(res => Array.isArray(data) ? res : res[0]);

const findByStudentId = (studentId, options = {}) => AcademicRecord.find({ student_id: studentId }, null, options).sort({ semester: 1 });

module.exports = {
  create,
  findByStudentId
};
