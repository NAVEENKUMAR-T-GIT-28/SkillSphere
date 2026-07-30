const identityBuilder = require('./identity.builder');
const classBuilder = require('./class.builder');
const academicBuilder = require('./academic.builder');
const codingBuilder = require('./coding.builder');
const atsBuilder = require('./ats.builder');
const portfolioBuilder = require('./portfolio.builder');
const placementBuilder = require('./placement.builder');
const mentorBuilder = require('./mentor.builder');
const verificationBuilder = require('./verification.builder');

const { validateProjection } = require('./projection.validator');
const studentSearchRepo = require('../../repositories/studentSearchRepo');

/**
 * Builds the complete flattened StudentSearch document by orchestrating all domain builders.
 * @param {ObjectId} studentId 
 * @param {String} syncSource 
 * @returns {Promise<Object>} The upserted projection document
 */
const buildProjection = async (studentId, syncSource = 'Unknown') => {
  const startTime = Date.now();
  
  // 1. Run all builders concurrently in strict isolation
  const results = await Promise.all([
    identityBuilder.build(studentId),
    classBuilder.build(studentId),
    academicBuilder.build(studentId),
    codingBuilder.build(studentId),
    atsBuilder.build(studentId),
    portfolioBuilder.build(studentId),
    placementBuilder.build(studentId),
    mentorBuilder.build(studentId),
    verificationBuilder.build(studentId)
  ]);
  
  // 2. Merge builder outputs
  const merged = results.reduce((acc, current) => {
    return { ...acc, ...current };
  }, {});
  
  const durationMs = Date.now() - startTime;
  
  // 3. Validate and enforce defaults
  const validated = validateProjection(merged, syncSource, durationMs);
  
  // Safeguard: Prevent mixed schema by forcing complete wipe if version differs
  const CURRENT_VERSION = 1;
  const existing = await studentSearchRepo.findByStudent(studentId);
  
  if (existing && existing.system?.projection_version !== CURRENT_VERSION) {
    // Also catch any legacy flat documents using 'student_id' at root
    const StudentSearch = require('../../models/StudentSearch');
    await StudentSearch.deleteMany({
      $or: [
        { 'identity.student_id': studentId },
        { student_id: studentId }
      ]
    });
  }
  
  // 4. Upsert Projection
  const savedProjection = await studentSearchRepo.upsertProjection(studentId, validated);
  return savedProjection;
};

module.exports = { buildProjection };
