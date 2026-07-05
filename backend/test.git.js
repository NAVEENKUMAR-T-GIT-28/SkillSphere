const axios = require("axios");

async function fetchGithubProfile(username) {
  try {
    const { data } = await axios.get(
      `https://api.github.com/users/${username}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "SkillSphere"
        }
      }
    );

    console.log(data);
  } catch (err) {
    console.log(err.response?.status);
    console.log(err.response?.data);
  }
}

fetchGithubProfile("NAVEENKUMAR-T-GIT-28");