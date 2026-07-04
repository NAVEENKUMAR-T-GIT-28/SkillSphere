/**
 * services/search.js
 * Student search business workflows.
 * Handles filter construction, skill aggregation, and paginated result fetching.
 */

const studentRepo = require('../repositories/studentRepo');
const skillRepo = require('../repositories/skillRepo');
const studentSearchRepo = require('../repositories/studentSearchRepo');
const { getClassIds } = require('../utils/classQuery');
const { paginate, buildMeta } = require('../utils/pagination');

/**
 * Search students from the normalised Student collection (primary endpoint).
 * Supports CGPA range, class hierarchy, tier, name, and multi-skill filters.
 */
const searchStudents = async (params) => {
  const {
    cgpa_min, cgpa_max, skills, department, section, batch_year, graduation_year, tier, name,
    page = 1, limit = 20, sort_by = 'readiness_score', sort_order = 'desc'
  } = params;

  const filter = {};

  if (cgpa_min || cgpa_max) {
    filter.cgpa = {};
    if (cgpa_min) filter.cgpa.$gte = parseFloat(cgpa_min);
    if (cgpa_max) filter.cgpa.$lte = parseFloat(cgpa_max);
  }

  if (department || section || batch_year || graduation_year) {
    const classIds = await getClassIds({
      department,
      sections: section ? section.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      batch_years: batch_year ? batch_year.split(',').map(Number).filter(Boolean) : undefined,
      graduation_year: graduation_year ? graduation_year.split(',').map(Number).filter(Boolean)[0] : undefined
    });

    if (classIds.length === 0) {
      return { students: [], meta: buildMeta(0, page, limit) };
    }
    filter.class_id = { $in: classIds };
  }

  if (tier) {
    const tiers = tier.split(',').map(t => t.trim()).filter(Boolean);
    filter.readiness_tier = tiers.length > 1 ? { $in: tiers } : tiers[0];
  }

  if (name) {
    filter.full_name = { $regex: name, $options: 'i' };
  }

  if (skills) {
    const skillNames = skills.split(',').map(s => s.trim()).filter(Boolean);
    const matchPipeline = [
      { $match: { skill_name: { $in: skillNames }, status: 'verified' } },
      { $group: { _id: '$student_id', matchedSkills: { $addToSet: '$skill_name' } } },
      { $match: { $expr: { $eq: [{ $size: '$matchedSkills' }, skillNames.length] } } }
    ];
    const matchedStudents = await skillRepo.aggregate(matchPipeline);
    const matchedIds = matchedStudents.map(s => s._id);

    if (matchedIds.length === 0) {
      return { students: [], meta: buildMeta(0, page, limit) };
    }
    filter._id = { $in: matchedIds };
  }

  const sortObj = {};
  sortObj[sort_by] = sort_order === 'asc' ? 1 : -1;

  const { skip, limit: parsedLimit, page: parsedPage } = paginate(page, limit);
  const total = await studentRepo.countDocuments(filter);
  const students = await studentRepo.findAll(filter)
    .select('-links')
    .sort(sortObj)
    .skip(skip)
    .limit(parsedLimit);

  return { students, meta: buildMeta(total, parsedPage, parsedLimit) };
};

/**
 * Search students from the denormalized StudentSearch collection (V2 endpoint).
 * Faster single-collection query, no aggregation pipeline needed.
 */
const searchStudentsV2 = async (params) => {
  const {
    cgpa_min, cgpa_max, skills, department, section, batch_year, tier, name,
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

  if (tier) {
    const tiers = tier.split(',').map(t => t.trim()).filter(Boolean);
    filter.readiness_tier = tiers.length > 1 ? { $in: tiers } : tiers[0];
  }

  if (name) {
    filter.name = { $regex: name, $options: 'i' };
  }

  if (skills) {
    const skillNames = skills.split(',').map(s => s.trim()).filter(Boolean);
    filter.verified_skills = { $all: skillNames };
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

module.exports = { searchStudents, searchStudentsV2 };
