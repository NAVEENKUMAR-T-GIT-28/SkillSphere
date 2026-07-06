/**
 * services/search.js
 * Student search business workflows.
 * Handles filter construction, skill aggregation, and paginated result fetching.
 */

const studentSearchRepo = require('../repositories/studentSearchRepo');
const { paginate, buildMeta } = require('../utils/pagination');

/**
 * Search students from the denormalized StudentSearch collection (V2 endpoint).
 * Faster single-collection query, no aggregation pipeline needed.
 */
const searchStudentsV2 = async (params) => {
  const {
    cgpa_min, cgpa_max, skills, department, section, batch_year, tier, name,
    roll_number, graduation_year, projects_min, internships_min, 
    certifications_min, skills_min, coding_platforms, has_resume,
    page = 1, limit = 20, sort_by = 'readiness_score', sort_order = 'desc'
  } = params;

  const filter = {};

  if (cgpa_min || cgpa_max) {
    filter.cgpa = {};
    if (cgpa_min) filter.cgpa.$gte = parseFloat(cgpa_min);
    if (cgpa_max) filter.cgpa.$lte = parseFloat(cgpa_max);
  }

  if (department) filter.department = department;
  if (section) {
    const sections = section.split(',').map(s => s.trim()).filter(Boolean);
    filter.section = sections.length > 1 ? { $in: sections } : sections[0];
  }
  if (batch_year) {
    const batchYears = batch_year.split(',').map(Number).filter(Boolean);
    filter.batch_year = batchYears.length > 1 ? { $in: batchYears } : batchYears[0];
  }
  if (graduation_year) {
    const gradYears = graduation_year.split(',').map(Number).filter(Boolean);
    filter.graduation_year = gradYears.length > 1 ? { $in: gradYears } : gradYears[0];
  }

  if (tier) {
    const tiers = tier.split(',').map(t => t.trim()).filter(Boolean);
    filter.readiness_tier = tiers.length > 1 ? { $in: tiers } : tiers[0];
  }

  if (name) {
    filter.name = { $regex: name, $options: 'i' };
  }
  if (roll_number) {
    filter.roll_number = { $regex: roll_number, $options: 'i' };
  }

  if (skills) {
    const skillNames = skills.split(',').map(s => s.trim()).filter(Boolean);
    filter.verified_skills = { $all: skillNames };
  }
  
  if (skills_min && parseInt(skills_min) > 0) {
    const idx = parseInt(skills_min) - 1;
    if (!filter.verified_skills) filter.verified_skills = {};
    filter.verified_skills[`${idx}`] = { $exists: true };
  }

  if (certifications_min && parseInt(certifications_min) > 0) {
    const idx = parseInt(certifications_min) - 1;
    filter.verified_certifications = { [`${idx}`]: { $exists: true } };
  }

  if (projects_min && parseInt(projects_min) > 0) {
    filter.project_count = { $gte: parseInt(projects_min) };
  }

  if (internships_min && parseInt(internships_min) > 0) {
    filter.internship_count = { $gte: parseInt(internships_min) };
  }

  if (coding_platforms) {
    const platforms = coding_platforms.split(',').map(s => s.trim()).filter(Boolean);
    filter.coding_platforms = { $in: platforms };
  }

  if (has_resume === 'true' || has_resume === true) {
    filter.has_resume = true;
  }

  const sortObj = {};
  sortObj[sort_by] = sort_order === 'asc' ? 1 : -1;

  const { skip, limit: parsedLimit, page: parsedPage } = paginate(page, limit);
  const total = await studentSearchRepo.countDocuments(filter);
  const students = await studentSearchRepo.find(filter)
    .sort(sortObj)
    .skip(skip)
    .limit(parsedLimit);

  return { students, meta: buildMeta(total, parsedPage, parsedLimit) };
};

module.exports = { searchStudentsV2 };
