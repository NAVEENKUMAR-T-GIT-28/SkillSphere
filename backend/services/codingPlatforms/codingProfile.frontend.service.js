// services/codingPlatforms/codingProfile.frontend.service.js
const codingProfileRepo = require('../../repositories/codingProfileRepo');

const PLATFORM_META = {
  leetcode:   { label: 'LeetCode',   color: 'yellow' },
  hackerrank: { label: 'HackerRank', color: 'green' },
  skillrack:  { label: 'SkillRack',  color: 'purple' },
  github:     { label: 'GitHub',     color: 'slate' }
};

/**
 * Returns a frontend-ready shape: always includes all 3 platform keys
 * (even if not linked yet) so the UI can render placeholder cards
 * without conditional key-checking.
 */
const getProfileForFrontend = async (studentId) => {
  const doc = await codingProfileRepo.findByStudentId(studentId);
  const platforms = doc?.platforms || {};

  // For GitHub, the source of truth for the link is Student.links.github
  const Student = require('../../models/Student');
  const student = await Student.findById(studentId).select('links');
  const githubUrl = student?.links?.github;

  const result = {};
  for (const key of Object.keys(PLATFORM_META)) {
    const platformData = platforms[key];
    
    // If it's GitHub and the URL exists in the Student profile, mark it as linked
    let isLinked = !!platformData;
    let profileUrl = platformData?.profile_url || null;
    
    if (key === 'github' && githubUrl) {
      isLinked = true;
      profileUrl = githubUrl;
    }
    result[key] = {
      ...PLATFORM_META[key],
      linked: isLinked,
      profile_url: profileUrl,
      fetched_at: platformData?.fetched_at || null,
      last_refresh_status: platformData?.last_refresh_status || null,
      last_refresh_error: platformData?.last_refresh_error || null,
      data: platformData?.data || null
    };
  }

  return result;
};

module.exports = { getProfileForFrontend, PLATFORM_META };
