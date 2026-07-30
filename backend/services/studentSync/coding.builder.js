const codingProfileRepo = require('../../repositories/codingProfileRepo');

const build = async (studentId) => {
  const profile = await codingProfileRepo.findByStudentId(studentId);
  if (!profile) return {};
  
  return {
    coding: {
      overall_score: profile.overall_score || 0,
      dna_score: profile.dna_score || 0,
      last_synced: profile.last_synced_at || new Date()
    }
  };
};
module.exports = { build };
