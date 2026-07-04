// repositories/codingProfileRepo.js
const CodingProfile = require('../models/CodingProfile');

const findByStudentId = (studentId) => CodingProfile.findOne({ student_id: studentId });

const createForStudent = (studentId) => CodingProfile.create({ student_id: studentId, platforms: {} });

const findOne = (filter) => CodingProfile.findOne(filter);
const create = (data) => CodingProfile.create(data);
const deleteOne = (filter) => CodingProfile.deleteOne(filter);

const findOrCreateForStudent = async (studentId) => {
  let doc = await findByStudentId(studentId);
  if (!doc) doc = await createForStudent(studentId);
  return doc;
};

/**
 * Set (overwrite) a single platform's embedded object.
 * Used both for the initial link-and-fetch and for refresh.
 */
const setPlatformData = (studentId, platformKey, platformData) =>
  CodingProfile.findOneAndUpdate(
    { student_id: studentId },
    { $set: { [`platforms.${platformKey}`]: platformData } },
    { new: true, upsert: true }
  );

const removePlatform = (studentId, platformKey) =>
  CodingProfile.findOneAndUpdate(
    { student_id: studentId },
    { $unset: { [`platforms.${platformKey}`]: "" } },
    { new: true }
  );

/**
 * Backward-compat shim: returns an array of old-style { platform, problems_solved, ... }
 * objects so that readinessScore.js (which iterates an array) doesn't crash.
 * Will be removed when readiness score is rewritten for the new schema.
 */
const findAllLegacy = async (studentId) => {
  const doc = await findByStudentId(studentId);
  if (!doc || !doc.platforms) return [];
  const result = [];
  for (const [platform, data] of Object.entries(doc.platforms)) {
    if (!data) continue;
    result.push({
      platform,
      username: data.username || data.skillrack_id || null,
      profile_url: data.profile_url || null,
      problems_solved: data.data?.totalSolved || data.data?.solved || 0,
      contest_rating: data.data?.contestRating || 0,
      badges: data.data?.badges || [],
      skillrack_stats: platform === 'skillrack' ? {
        code_track: data.data?.codeTrack || 0,
        dc: data.data?.dc || 0,
        dt: data.data?.dt || 0,
        code_test: data.data?.codeTest || 0,
        code_tutor: data.data?.codeTutor || 0,
        solved: data.data?.solved || 0,
        sr_certificates: data.data?.certificates || 0,
        raw_points: data.data?.points || 0
      } : undefined
    });
  }
  return result;
};

const updatePlatformsBatch = (studentId, sets = {}, unsets = {}) => {
  const updateOp = {};
  if (Object.keys(sets).length > 0) updateOp.$set = sets;
  if (Object.keys(unsets).length > 0) updateOp.$unset = unsets;
  
  if (Object.keys(updateOp).length === 0) return Promise.resolve();

  return CodingProfile.findOneAndUpdate(
    { student_id: studentId },
    updateOp,
    { new: true, upsert: true }
  );
};

const count = (filter) => CodingProfile.countDocuments(filter);
const findMany = (filter) => CodingProfile.find(filter);

module.exports = {
  findByStudentId,
  findMany,
  find: findMany,
  findOne,
  create,
  deleteOne,
  createForStudent,
  findOrCreateForStudent,
  setPlatformData,
  removePlatform,
  findAllLegacy,
  updatePlatformsBatch,
  count,
  countDocuments: count
};
