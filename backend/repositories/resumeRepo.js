const Resume = require('../models/Resume');

exports.findByStudentId = async (studentId) => {
  return await Resume.find({ student_id: studentId }).sort({ version: -1 });
};

exports.findLatestByStudentId = async (studentId) => {
  return await Resume.findOne({ student_id: studentId }).sort({ version: -1 });
};

exports.updateManyToNotLatest = async (studentId) => {
  return await Resume.updateMany(
    { student_id: studentId, is_latest: true },
    { is_latest: false }
  );
};

exports.createResume = async (data) => {
  return await Resume.create(data);
};

exports.findByIdAndStudentId = async (resumeId, studentId) => {
  return await Resume.findOne({ _id: resumeId, student_id: studentId });
};

exports.deleteById = async (resumeId) => {
  return await Resume.findByIdAndDelete(resumeId);
};

exports.saveResume = async (resume) => {
  return await resume.save();
};
