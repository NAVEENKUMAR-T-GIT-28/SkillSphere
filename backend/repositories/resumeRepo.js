const Resume = require('../models/Resume');

const findMany = async (filter) => Resume.find(filter).sort({ version: -1 });
const findOne = async (filter) => Resume.findOne(filter).sort({ version: -1 });
const create = async (data) => Resume.create(data);
const deleteById = async (id) => Resume.findByIdAndDelete(id);

exports.findMany = findMany;
exports.findOne = findOne;
exports.create = create;
exports.deleteById = deleteById;

exports.findByStudentId = async (studentId) => findMany({ student_id: studentId });
exports.findLatestByStudentId = async (studentId) => findOne({ student_id: studentId });
exports.updateManyToNotLatest = async (studentId) => Resume.updateMany({ student_id: studentId, is_latest: true }, { is_latest: false });
exports.createResume = create;
exports.findByIdAndStudentId = async (resumeId, studentId) => findOne({ _id: resumeId, student_id: studentId });
exports.saveResume = async (resume) => await resume.save();
