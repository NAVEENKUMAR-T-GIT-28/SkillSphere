const axios = require('axios');

/**
 * Extracts username from various forms of GitHub URLs
 */
function extractUsername(url) {
  if (!url) return null;
  // Remove protocol and trailing slashes
  let cleanUrl = url.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
  
  // Format: github.com/username
  if (cleanUrl.toLowerCase().includes('github.com/')) {
    const parts = cleanUrl.split('github.com/');
    if (parts.length > 1) {
      const username = parts[1].split('/')[0]; // take just the username part
      return username || null;
    }
  }
  
  // If it doesn't contain github.com, maybe they just entered the username
  // Simple fallback
  if (!cleanUrl.includes('/') && !cleanUrl.includes('.')) {
    return cleanUrl;
  }
  
  return null;
}

exports.fetchGithubProfile = async ({ githubUrl }) => {
  const username = extractUsername(githubUrl);
  
  if (!username) {
    const err = new Error('Invalid GitHub URL format.');
    err.status = 400;
    throw err;
  }

  try {
    const { data } = await axios.get(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'SkillSphere-Platform'
        },
        timeout: 5000
      }
    );

    return {
      username: data.login || '',
      profile_url: data.html_url || `https://github.com/${username}`,
      fetched_at: new Date().toISOString(),
      data: {
        name: data.name || '',
        avatar_url: data.avatar_url || '',
        bio: data.bio || '',
        followers: data.followers || 0,
        following: data.following || 0,
        public_repos: data.public_repos || 0,
        joined: data.created_at || ''
      },
      last_refresh_status: 'success',
      last_refresh_error: null
    };
  } catch (err) {
    if (err.response) {
      if (err.response.status === 404) {
        throw new Error('GitHub profile not found.');
      }
      if (err.response.status === 403 || err.response.status === 429) {
        throw new Error('GitHub API rate limit exceeded.');
      }
    }
    throw new Error('Unable to communicate with GitHub API.');
  }
};
