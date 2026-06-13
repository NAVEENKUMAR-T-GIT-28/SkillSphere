// repositories/readinessHistoryRepo.js
const ReadinessScoreHistory = require('../models/ReadinessScoreHistory');

const findByStudentId = (studentId) => ReadinessScoreHistory.find({ student_id: studentId }).sort({ calculated_at: -1 });
const create = (data) => ReadinessScoreHistory.create(data);

module.exports = { findByStudentId, create };
