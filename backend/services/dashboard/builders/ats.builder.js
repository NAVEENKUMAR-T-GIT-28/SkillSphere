/**
 * ATS Builder
 * Fetches ATS data from Resume module.
 */
const Resume = require('../../../models/Resume');

async function buildAts(searchDoc) {
  const ats = searchDoc.ats || {};

  return {
    enabled: true,
    beta: true,
    score: typeof ats.score === 'number' ? ats.score : null,
    grade: ats.grade || null
  };
}

module.exports = { buildAts };
