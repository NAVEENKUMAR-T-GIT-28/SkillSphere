/**
 * Portfolio Builder
 * Single query helper to grab counts for portfolio items.
 */
const Skill = require('../../../models/Skill');
const Project = require('../../../models/Project');
const Internship = require('../../../models/Internship');
const Certification = require('../../../models/Certification');
const Achievement = require('../../../models/Achievement');

async function buildPortfolio(searchDoc) {
  const p = searchDoc.portfolio || {};

  // TODO: `total` and `pending` are legacy compatibility fields for the frontend.
  // The StudentSearch projection only stores the canonical counts.
  const mapSingleCount = (count) => {
    const verified = typeof count === 'number' ? count : 0;
    return {
      count: verified, // New canonical field
      // --- Legacy compatibility fields below ---
      total: verified,
      verified: verified,
      pending: 0,
      progress: verified > 0 ? 100 : 0
    };
  };

  return {
    completion: typeof p.completion === 'number' ? p.completion : 0, // Canonical field
    overall: typeof p.completion === 'number' ? p.completion : 0, // Legacy field
    skills: mapSingleCount(p.verified_skill_count),
    projects: mapSingleCount(p.project_count),
    internships: mapSingleCount(p.internship_count),
    certifications: mapSingleCount(p.certification_count),
    achievements: mapSingleCount(0) // Achievements not currently projected in StudentSearch
  };
}

module.exports = { buildPortfolio };
