// repositories/readinessHistoryRepo.js
const ReadinessScoreHistory = require('../models/ReadinessScoreHistory');

const findMany = (filter) => ReadinessScoreHistory.find(filter).sort({ calculated_at: -1 });

const findByStudentId = (studentId) => findMany({ student_id: studentId });
const create = (data) => ReadinessScoreHistory.create(data);

module.exports = { findByStudentId, create, findMany, find: findMany };
