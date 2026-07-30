const StudentSearch = require('../models/StudentSearch');

/**
 * upsertProjection
 * @param {ObjectId} studentId 
 * @param {Object} projectionData 
 * @returns {Promise<Object>}
 */
const upsertProjection = async (studentId, projectionData) => {
  return StudentSearch.findOneAndUpdate(
    { 'identity.student_id': studentId },
    { $set: projectionData },
    { upsert: true, new: true, runValidators: true }
  );
};

/**
 * findByStudent
 * @param {ObjectId} studentId 
 * @returns {Promise<Object>}
 */
const findByStudent = async (studentId) => {
  return StudentSearch.findOne({ 'identity.student_id': studentId });
};

/**
 * findByUser
 * @param {ObjectId} userId 
 * @returns {Promise<Object>}
 */
const findByUser = async (userId) => {
  return StudentSearch.findOne({ 'identity.user_id': userId });
};

/**
 * findByClass
 * @param {ObjectId} classId 
 * @returns {Promise<Array>}
 */
const findByClass = async (classId) => {
  return StudentSearch.find({ 'class.id': classId });
};

/**
 * deleteProjection
 * @param {ObjectId} studentId 
 * @returns {Promise<Object>}
 */
const deleteProjection = async (studentId) => {
  return StudentSearch.deleteOne({ 'identity.student_id': studentId });
};

/**
 * rebuildBatch
 * Executes bulk write for projections
 */
const rebuildBatch = async (batchOperations) => {
  return StudentSearch.bulkWrite(batchOperations);
};

/**
 * find
 * @param {Object} query 
 * @param {Object} options (skip, limit, sort)
 * @returns {Promise<Array>}
 */
const find = (query, options = {}) => {
  let q = StudentSearch.find(query);
  if (options.sort) q = q.sort(options.sort);
  if (options.skip) q = q.skip(options.skip);
  if (options.limit) q = q.limit(options.limit);
  return q;
};

/**
 * countDocuments
 * @param {Object} query 
 * @returns {Promise<Number>}
 */
const countDocuments = (query) => {
  return StudentSearch.countDocuments(query);
};

/**
 * aggregate
 * @param {Array} pipeline 
 * @returns {Promise<Array>}
 */
const aggregate = (pipeline) => {
  return StudentSearch.aggregate(pipeline);
};

module.exports = {
  upsertProjection,
  findByStudent,
  findByUser,
  findByClass,
  deleteProjection,
  rebuildBatch,
  find,
  countDocuments,
  aggregate
};
