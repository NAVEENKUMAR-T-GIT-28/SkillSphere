/**
 * Coding Builder
 * Fetches coding DNA stats from CodingProfile module.
 */
const CodingProfile = require('../../../models/CodingProfile');

async function buildCoding(studentId) {
  const profile = await CodingProfile.findOne({ student_id: studentId }).lean();
  
  if (!profile || !profile.platforms) {
    return {
      leetcode: { connected: false, solved: 0, ranking: null, last_sync: "" },
      hackerrank: { connected: false, stars: 0, language: "" },
      skillrack: { connected: false, points: 0, rank: null },
      github: { connected: false, repositories: 0, last_sync: "" },
      _dnaScore: 0 // Used by career health builder internally
    };
  }

  const p = profile.platforms;
  
  // Calculate a mock DNA score based on connections and activity (just a heuristic for the dashboard aggregation)
  let dnaScore = 0;
  if (p.leetcode) dnaScore += Math.min(25, (p.leetcode.solved || 0) / 10);
  if (p.hackerrank) dnaScore += Math.min(25, (p.hackerrank.stars || 0) * 5);
  if (p.skillrack) dnaScore += Math.min(25, (p.skillrack.points || 0) / 400);
  if (p.github) dnaScore += Math.min(25, (p.github.repositories || 0));

  return {
    leetcode: {
      connected: !!p.leetcode,
      solved: p.leetcode ? p.leetcode.solved || 0 : 0,
      ranking: p.leetcode ? p.leetcode.ranking || null : null,
      last_sync: p.leetcode ? p.leetcode.last_sync || "" : ""
    },
    hackerrank: {
      connected: !!p.hackerrank,
      stars: p.hackerrank ? p.hackerrank.stars || 0 : 0,
      language: p.hackerrank ? p.hackerrank.language || "" : ""
    },
    skillrack: {
      connected: !!p.skillrack,
      points: p.skillrack ? p.skillrack.points || 0 : 0,
      rank: p.skillrack ? p.skillrack.rank || null : null
    },
    github: {
      connected: !!p.github,
      repositories: p.github ? p.github.repositories || 0 : 0,
      last_sync: p.github ? p.github.last_sync || "" : ""
    },
    _dnaScore: Math.min(100, Math.round(dnaScore))
  };
}

module.exports = { buildCoding };
