// services/codingPlatforms/hackerrank.service.js
const axios = require('axios');

const headersFor = (username) => ({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36',
  Accept: 'application/json',
  Referer: `https://www.hackerrank.com/profile/${username}`,
  Origin: 'https://www.hackerrank.com'
});

const fetchHackerRankProfile = async (username) => {
  const headers = headersFor(username);

  const [profileRes, badgesRes, certRes] = await Promise.allSettled([
    axios.get(`https://www.hackerrank.com/rest/contests/master/hackers/${username}/profile`, { headers, timeout: 10000 }),
    axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, { headers, timeout: 10000 }),
    axios.get(`https://www.hackerrank.com/community/v1/test_results/hacker_certificate?username=${username}`, { headers, timeout: 10000 })
  ]);

  if (profileRes.status !== 'fulfilled') {
    throw new Error('HackerRank profile not found');
  }

  const profile = profileRes.value.data?.model || {};
  const badges = badgesRes.status === 'fulfilled' ? (badgesRes.value.data?.models || []) : [];
  const certificates = certRes.status === 'fulfilled' ? (certRes.value.data?.data || []) : [];

  return {
    username: profile.username || username,
    profile_url: `https://www.hackerrank.com/profile/${username}`,
    fetched_at: new Date().toISOString(),
    data: {
      name: profile.name || null,
      country: profile.country || null,
      school: profile.school || null,
      createdAt: profile.created_at || null,

      badges: badges.map((b) => ({
        badgeName: b.badge_name,
        category: b.category_name,
        stars: b.stars,
        solved: b.solved,
        totalChallenges: b.total_challenges,
        rank: b.hacker_rank,
        points: b.current_points
      })),

      certificates: certificates.map((c) => ({
        name: c.attributes?.certificate?.label || null,
        level: c.attributes?.certificate?.level || null,
        completedAt: c.attributes?.completed_at || null,
        score: c.attributes?.score || null,
        image: c.attributes?.certificate_image || null
      }))
    },
    last_refresh_status: 'success',
    last_refresh_error: null
  };
};

module.exports = { fetchHackerRankProfile };
