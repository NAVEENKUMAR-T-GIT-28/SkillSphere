// controllers/codingProfileController.js
const { validationResult } = require('express-validator');
const codingProfileRepo = require('../repositories/codingProfileRepo');
const { fetchLeetCodeProfile } = require('../services/codingPlatforms/leetcode.service');
const { fetchHackerRankProfile } = require('../services/codingPlatforms/hackerrank.service');
const { fetchSkillRackProfile } = require('../services/codingPlatforms/skillrack.service');
const { fetchGithubProfile } = require('../services/codingPlatforms/github.service');
const { getProfileForFrontend } = require('../services/codingPlatforms/codingProfile.frontend.service');
const { success, error } = require('../utils/response');

const PLATFORM_FETCHERS = {
  leetcode: (body) => fetchLeetCodeProfile(body.username),
  hackerrank: (body) => fetchHackerRankProfile(body.username),
  skillrack: (body) => fetchSkillRackProfile(body.skillrack_id, body.skillrack_key),
  github: (body) => fetchGithubProfile({ githubUrl: body.githubUrl || body.username })
};

/**
 * GET /api/students/:studentId/coding-profile
 * Frontend-ready shape — all 3 platforms always present (linked or not).
 */
exports.getCodingProfile = async (req, res, next) => {
  try {
    const result = await getProfileForFrontend(req.params.studentId);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/students/:studentId/coding-profile/:platform/link
 * First-time link: fetch immediately, fail loudly if fetch fails (no partial link).
 */
exports.linkPlatform = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map((e) => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const { platform, studentId } = req.params;
    const fetcher = PLATFORM_FETCHERS[platform];
    if (!fetcher) {
      return error(res, `Unsupported platform: ${platform}`, 400, 'UNSUPPORTED_PLATFORM');
    }

    let platformData;
    try {
      platformData = await fetcher(req.body);
    } catch (fetchErr) {
      return error(res, `Could not fetch ${platform} profile: ${fetchErr.message}`, 422, 'FETCH_FAILED');
    }

    const updated = await codingProfileRepo.setPlatformData(studentId, platform, platformData);
    success(res, updated.platforms[platform], {}, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/students/:studentId/coding-profile/:platform/refresh
 * Re-fetch using already-stored credentials for that platform (username, or skillrack id/key).
 * Rate-limited at the route level.
 */
exports.refreshPlatform = async (req, res, next) => {
  try {
    const { platform, studentId } = req.params;
    const fetcher = PLATFORM_FETCHERS[platform];
    if (!fetcher) {
      return error(res, `Unsupported platform: ${platform}`, 400, 'UNSUPPORTED_PLATFORM');
    }

    const profileDoc = await codingProfileRepo.findByStudentId(studentId);
    const existing = profileDoc?.platforms?.[platform];
    
    if (!existing) {
      return error(res, `${platform} is not linked yet`, 404, 'NOT_LINKED');
    }

    const body = platform === 'skillrack'
      ? { skillrack_id: existing.skillrack_id, skillrack_key: existing.skillrack_key }
      : { username: existing.username, githubUrl: existing.profile_url };
    let platformData;
    try {
      platformData = await fetcher(body);
    } catch (fetchErr) {
      // On refresh failure, keep old data but mark the failure so the UI can show it
      const failedData = { ...existing, last_refresh_status: 'failed', last_refresh_error: fetchErr.message };
      await codingProfileRepo.setPlatformData(studentId, platform, failedData);
      return error(res, `Refresh failed: ${fetchErr.message}`, 422, 'REFRESH_FAILED');
    }

    const updated = await codingProfileRepo.setPlatformData(studentId, platform, platformData);
    success(res, updated.platforms[platform]);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/students/:studentId/coding-profile/:platform
 * Unlink a platform.
 */
exports.unlinkPlatform = async (req, res, next) => {
  try {
    const { platform, studentId } = req.params;
    await codingProfileRepo.removePlatform(studentId, platform);
    success(res, { message: `${platform} unlinked successfully` });
  } catch (err) {
    next(err);
  }
};

/**
 * Parse coding platform URL into fetcher credentials
 */
const parseCodingUrl = (platform, url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (platform === 'leetcode') {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts[0] === 'u') return { username: parts[1] };
      return { username: parts[0] };
    }
    if (platform === 'hackerrank') {
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts[0] === 'profile') return { username: parts[1] };
      return { username: parts[0] };
    }
    if (platform === 'skillrack') {
      const id = urlObj.searchParams.get('id');
      const key = urlObj.searchParams.get('key');
      if (id && key) return { skillrack_id: id, skillrack_key: key };
      return null;
    }
  } catch (e) {
    return null;
  }
  return null;
};

/**
 * PATCH /api/students/:studentId/coding-profile/links
 * Update coding platform URLs AND fetch data if changed.
 */
exports.updatePlatformLinks = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const incomingLinks = {
      leetcode: req.body.leetcode,
      hackerrank: req.body.hackerrank,
      skillrack: req.body.skillrack
    };

    const profileDoc = await codingProfileRepo.findOrCreateForStudent(studentId);
    const existingPlatforms = profileDoc.platforms || {};

    const sets = {};
    const unsets = {};

    for (const [platform, url] of Object.entries(incomingLinks)) {
      if (url === undefined) continue;

      const existingUrl = existingPlatforms[platform]?.profile_url || '';
      const trimmedUrl = url ? url.trim() : '';

      if (trimmedUrl === '') {
        if (existingUrl !== '') {
          unsets[`platforms.${platform}`] = "";
        }
        continue;
      }

      if (trimmedUrl === existingUrl) {
        continue;
      }

      const creds = parseCodingUrl(platform, trimmedUrl);
      if (!creds || (!creds.username && !creds.skillrack_id)) {
        return error(res, `Invalid URL format for ${platform}`, 400, 'INVALID_URL');
      }

      const fetcher = PLATFORM_FETCHERS[platform];
      try {
        const platformData = await fetcher(creds);
        platformData.profile_url = trimmedUrl; // Ensure exact user URL is stored
        sets[`platforms.${platform}`] = platformData;
      } catch (fetchErr) {
        return error(res, `Could not fetch ${platform} profile: ${fetchErr.message}`, 422, 'FETCH_FAILED');
      }
    }

    await codingProfileRepo.updatePlatformsBatch(studentId, sets, unsets);

    const result = await getProfileForFrontend(studentId);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * Legacy routes for single platform management
 */
exports.listCodingProfiles = async (req, res, next) => {
  try {
    const profiles = await codingProfileRepo.find({ student_id: req.params.studentId }).sort({ platform: 1 });
    success(res, profiles, { total: profiles.length });
  } catch (err) {
    next(err);
  }
};

exports.addCodingProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const { platform } = req.body;
    const existing = await codingProfileRepo.find({ student_id: req.params.studentId, platform });
    if (existing && existing.length > 0) {
      return error(res, `You already have a ${platform} profile added`, 409, 'DUPLICATE_PLATFORM');
    }

    const { recalculateScore } = require('../services/readinessScore');
    const profile = await codingProfileRepo.create({
      student_id: req.params.studentId,
      ...req.body,
      last_updated: new Date()
    });

    await recalculateScore(req.params.studentId);
    success(res, profile, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateCodingProfile = async (req, res, next) => {
  try {
    const profile = await codingProfileRepo.findOne({
      _id: req.params.profileId,
      student_id: req.params.studentId
    });

    if (!profile) {
      return error(res, 'Coding profile not found', 404, 'NOT_FOUND');
    }

    const allowedFields = ['username', 'profile_url', 'problems_solved', 'contest_rating', 'badges'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    }

    profile.last_updated = new Date();
    await profile.save();

    const { recalculateScore } = require('../services/readinessScore');
    await recalculateScore(req.params.studentId);
    success(res, profile);
  } catch (err) {
    next(err);
  }
};

exports.deleteCodingProfile = async (req, res, next) => {
  try {
    const profile = await codingProfileRepo.findOne({
      _id: req.params.profileId,
      student_id: req.params.studentId
    });

    if (!profile) {
      return error(res, 'Coding profile not found', 404, 'NOT_FOUND');
    }

    await codingProfileRepo.deleteOne({ _id: req.params.profileId });

    const { recalculateScore } = require('../services/readinessScore');
    await recalculateScore(req.params.studentId);
    success(res, { message: 'Coding profile deleted successfully' });
  } catch (err) {
    next(err);
  }
};

