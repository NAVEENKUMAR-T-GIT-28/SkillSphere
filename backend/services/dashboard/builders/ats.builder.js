/**
 * ATS Builder
 * Fetches ATS data from Resume module.
 */
const Resume = require('../../../models/Resume');

async function buildAts(studentId) {
  const resume = await Resume.findOne({ student_id: studentId })
    .sort({ created_at: -1 })
    .select('ats_score ats_grade')
    .lean();

  if (!resume) {
    return {
      enabled: false,
      beta: true,
      score: null,
      grade: null
    };
  }

  return {
    enabled: true,
    beta: true,
    score: resume.ats_score || 0,
    grade: resume.ats_grade || null
  };
}

module.exports = { buildAts };
