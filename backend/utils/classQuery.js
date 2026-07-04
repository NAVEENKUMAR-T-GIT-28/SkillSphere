/**
 * classQuery.js
 * Helper utilities for querying students via their class_id.
 */

const classRepo = require('../repositories/classRepo');

const getClassIds = async ({
  department,
  departments,
  section,
  sections,
  batch_year,
  batch_years,
  graduation_year,
  is_active
} = {}) => {
  const query = {};

  if (department)              query.department    = department;
  if (departments?.length)     query.department    = { $in: departments };
  if (section)                 query.section       = section;
  if (sections?.length)        query.section       = { $in: sections };
  if (batch_year)              query.batch_year    = batch_year;
  if (batch_years?.length)     query.batch_year    = { $in: batch_years };
  if (graduation_year)         query.graduation_year = graduation_year;
  if (is_active !== undefined) query.is_active     = is_active;

  const classes = await classRepo.find(query);
  return classes.map(c => c._id);
};

module.exports = { getClassIds };
