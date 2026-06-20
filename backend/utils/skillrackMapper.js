/**
 * skillrackMapper.js
 * Maps raw SkillRack API response to the skillrack_stats schema shape.
 */

const computeRawPoints = ({ codeTrack = 0, dc = 0, dt = 0, codeTest = 0 }) =>
  (codeTrack * 2) + (dc * 2) + (dt * 20) + (codeTest * 30);

const mapApiToSkillrackStats = (apiData) => {
  const languages = {};
  const LANGUAGE_KEYS = ['c', 'python3', 'java', 'cpp23', 'sql'];
  for (const key of LANGUAGE_KEYS) {
    if (apiData[key] !== undefined) {
      languages[key] = Number(apiData[key]) || 0;
    }
  }

  return {
    code_track:   Number(apiData.codeTrack)     || 0,
    dc:           Number(apiData.dc)            || 0,
    dt:           Number(apiData.dt)            || 0,
    code_test:    Number(apiData.codeTest)      || 0,
    code_tutor:   Number(apiData.codeTutor)     || 0,
    solved:       Number(apiData.solved)        || 0,

    languages,

    badges: {
      gold:   Number(apiData.gold)   || 0,
      silver: Number(apiData.silver) || 0,
      bronze: Number(apiData.bronze) || 0
    },

    sr_rank:         apiData.rank   != null ? Number(apiData.rank) : null,
    level:           apiData.level  || null,
    sr_certificates: parseInt(apiData.certificates, 10) || 0,

    raw_points: computeRawPoints({
      codeTrack: apiData.codeTrack,
      dc:        apiData.dc,
      dt:        apiData.dt,
      codeTest:  apiData.codeTest
    })
  };
};

module.exports = { mapApiToSkillrackStats, computeRawPoints };
