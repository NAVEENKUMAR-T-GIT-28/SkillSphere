/**
 * Coding Builder
 * Fetches coding DNA stats from CodingProfile module.
 */
const CodingProfile = require('../../../models/CodingProfile');

async function buildCoding(searchDoc) {
  const coding = searchDoc.coding || {};
  
  return {
    leetcode: { connected: false, solved: 0, ranking: null, last_sync: "" },
    hackerrank: { connected: false, stars: 0, language: "" },
    skillrack: { connected: false, points: 0, rank: null },
    github: { connected: false, repositories: 0, last_sync: "" },
    _dnaScore: typeof coding.dna_score === 'number' ? coding.dna_score : 0
  };
}

module.exports = { buildCoding };
