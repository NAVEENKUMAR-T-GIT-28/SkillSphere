// services/codingPlatforms/codingProfile.frontend.service.js
const codingProfileRepo = require('../../repositories/codingProfileRepo');

const PLATFORM_META = {
  leetcode:   { label: 'LeetCode',   color: 'yellow' },
  hackerrank: { label: 'HackerRank', color: 'green' },
  skillrack:  { label: 'SkillRack',  color: 'purple' }
};

/**
 * Returns a frontend-ready shape: always includes all 3 platform keys
 * (even if not linked yet) so the UI can render placeholder cards
 * without conditional key-checking.
 */
const getProfileForFrontend = async (studentId) => {
  const doc = await codingProfileRepo.findByStudentId(studentId);
  const platforms = doc?.platforms || {};

  const result = {};
  for (const key of Object.keys(PLATFORM_META)) {
    const platformData = platforms[key];
    result[key] = {
      ...PLATFORM_META[key],
      linked: !!platformData,
      profile_url: platformData?.profile_url || null,
      fetched_at: platformData?.fetched_at || null,
      last_refresh_status: platformData?.last_refresh_status || null,
      last_refresh_error: platformData?.last_refresh_error || null,
      data: platformData?.data || null
    };
  }

  return result;
};

module.exports = { getProfileForFrontend, PLATFORM_META };
