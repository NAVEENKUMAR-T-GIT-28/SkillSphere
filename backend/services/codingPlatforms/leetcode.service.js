// services/codingPlatforms/leetcode.service.js
const axios = require('axios');

const QUERY = `query userProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { realName aboutMe userAvatar ranking reputation countryName company school skillTags starRating }
    submitStats { acSubmissionNum { difficulty count } }
    badges { id displayName icon }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts {
      advanced { tagName problemsSolved }
      intermediate { tagName problemsSolved }
      fundamental { tagName problemsSolved }
    }
  }
  userContestRanking(username: $username) {
    attendedContestsCount rating globalRanking totalParticipants topPercentage
  }
}`;

/**
 * Fetch a LeetCode profile and shape it into the documented platforms.leetcode.data contract.
 * Throws on failure — caller (controller) decides how to respond.
 */
const fetchLeetCodeProfile = async (username) => {
  const { data } = await axios.post(
    'https://leetcode.com/graphql',
    { query: QUERY, variables: { username } },
    { timeout: 10000 }
  );

  const matchedUser = data?.data?.matchedUser;
  if (!matchedUser) {
    throw new Error('LeetCode user not found');
  }

  const ac = matchedUser.submitStats?.acSubmissionNum || [];
  const byDifficulty = (level) => ac.find((s) => s.difficulty === level)?.count || 0;
  const ranking = data?.data?.userContestRanking;

  return {
    username: matchedUser.username,
    profile_url: `https://leetcode.com/u/${matchedUser.username}/`,
    fetched_at: new Date().toISOString(),
    data: {
      realName: matchedUser.profile?.realName || null,
      aboutMe: matchedUser.profile?.aboutMe || null,
      userAvatar: matchedUser.profile?.userAvatar || null,
      ranking: matchedUser.profile?.ranking ?? null,
      reputation: matchedUser.profile?.reputation ?? null,
      countryName: matchedUser.profile?.countryName || null,
      company: matchedUser.profile?.company || null,
      school: matchedUser.profile?.school || null,
      skillTags: matchedUser.profile?.skillTags || [],
      starRating: matchedUser.profile?.starRating ?? null,

      easySolved: byDifficulty('Easy'),
      mediumSolved: byDifficulty('Medium'),
      hardSolved: byDifficulty('Hard'),
      totalSolved: byDifficulty('All'),

      contestRating: ranking?.rating ? Math.round(ranking.rating) : null,
      globalRanking: ranking?.globalRanking ?? null,
      totalParticipants: ranking?.totalParticipants ?? null,
      topPercentage: ranking?.topPercentage ?? null,
      attendedContestsCount: ranking?.attendedContestsCount ?? 0,

      badges: matchedUser.badges || [],
      languageProblemCount: matchedUser.languageProblemCount || [],
      tagProblemCounts: matchedUser.tagProblemCounts || { advanced: [], intermediate: [], fundamental: [] }
    },
    last_refresh_status: 'success',
    last_refresh_error: null
  };
};

module.exports = { fetchLeetCodeProfile };
