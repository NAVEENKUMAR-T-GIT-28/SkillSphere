// repositories/verificationLogRepo.js
const VerificationLog = require('../models/VerificationLog');

const create = (data) => VerificationLog.create(data);
const count = (filter) => VerificationLog.countDocuments(filter);
const findMany = (filter, skip = 0, limit = 50) => VerificationLog.find(filter).populate('student_id', 'full_name roll_number').populate('actor_id', 'email').sort({ timestamp: -1 }).skip(skip).limit(limit);

module.exports = { create, findMany, find: findMany, count, countDocuments: count };
