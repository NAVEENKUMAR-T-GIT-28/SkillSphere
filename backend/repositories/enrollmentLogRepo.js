const EnrollmentLog = require('../models/EnrollmentLog');

const create = (data, options = {}) => EnrollmentLog.create(Array.isArray(data) ? data : [data], options).then(res => Array.isArray(data) ? res : res[0]);

const findByStudentId = (studentId, options = {}) => EnrollmentLog.find({ student_id: studentId }, null, options).sort({ timestamp: -1 });

module.exports = {
  create,
  findByStudentId
};
