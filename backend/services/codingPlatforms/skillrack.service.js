// services/codingPlatforms/skillrack.service.js
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * SkillRack points formula (replaces old 0-10 peer score entirely):
 * points = (codeTrack * 2) + (dc * 2) + (dt * 20) + (codeTest * 30)
 * codeTutor is tracked but contributes 0 points.
 */
const computePoints = ({ codeTrack = 0, dc = 0, dt = 0, codeTest = 0 }) =>
  (codeTrack * 2) + (dc * 2) + (dt * 20) + (codeTest * 30);

const fetchSkillRackProfile = async (skillrackId, skillrackKey) => {
  const url = `https://www.skillrack.com/faces/resume.xhtml?id=${skillrackId}&key=${skillrackKey}`;

  const response = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36' },
    timeout: 10000
  });

  const $ = cheerio.load(response.data);

  const name = $('.ui.big.label.black').first().text().trim();
  const leftColumn = $('.ui.four.wide.center.aligned.column').text().replace(/\s+/g, ' ').trim();
  const dept = $('.ui.large.label').first().text().trim();

  const collegeMatch = leftColumn.match(/CCE\s+(.*?)\s+\(Second Year\)/i);
  const college = collegeMatch ? collegeMatch[1].trim() : null;

  const yearMatch = leftColumn.match(/\)\s*(\d{4})/);
  const year = yearMatch ? yearMatch[1] : null;

  const stats = {};
  $('.statistic').each((i, el) => {
    const label = $(el).find('.label').text().replace(/\s+/g, ' ').trim();
    const value = $(el).find('.value').text().replace(/\s+/g, ' ').trim().replace(/[^\d/]/g, '');
    stats[label] = value;
  });

  const certificates = $('.ui.black.big.label span').first().text().trim();

  if (!name) {
    throw new Error('SkillRack profile not found — check id/key');
  }

  const codeTrack = Number(stats['CODE TRACK'] || 0);
  const dc = Number(stats['DC'] || 0);
  const dt = Number(stats['DT'] || 0);
  const codeTest = Number(stats['CODE TEST'] || 0);
  const codeTutor = Number(stats['CODE TUTOR'] || 0);

  return {
    skillrack_id: skillrackId,
    skillrack_key: skillrackKey,
    profile_url: url,
    fetched_at: new Date().toISOString(),
    data: {
      name,
      dept,
      college,
      year,
      certificates: Number(certificates || 0),

      rank: Number(stats['RANK'] || 0),
      level: stats['LEVEL'] || '0/10',
      gold: Number(stats['GOLD'] || 0),
      silver: Number(stats['SILVER'] || 0),
      bronze: Number(stats['BRONZE'] || 0),

      solved: Number(stats['PROGRAMS SOLVED'] || 0),
      codeTest,
      codeTrack,
      dc,
      dt,
      codeTutor,

      c: Number(stats['C'] || 0),
      python3: Number(stats['Python3'] || 0),
      java: Number(stats['Java'] || 0),
      cpp23: Number(stats['CPP23'] || 0),
      sql: Number(stats['SQL'] || 0),

      points: computePoints({ codeTrack, dc, dt, codeTest })
    },
    last_refresh_status: 'success',
    last_refresh_error: null
  };
};

module.exports = { fetchSkillRackProfile, computePoints };
