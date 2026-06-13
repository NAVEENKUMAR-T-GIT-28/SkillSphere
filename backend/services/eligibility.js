// services/eligibility.js
const studentRepo = require('../repositories/studentRepo');
const skillRepo = require('../repositories/skillRepo');

/**
 * Find all students eligible for a placement drive.
 */
async function findEligibleStudents(drive) {
  const filter = {};
  const elig = drive.eligibility || {};

  if (elig.min_cgpa) filter.cgpa = { $gte: elig.min_cgpa };
  if (elig.batch_years && elig.batch_years.length) filter.batch_year = { $in: elig.batch_years };
  if (elig.departments && elig.departments.length) filter.department = { $in: elig.departments };
  if (elig.sections && elig.sections.length) filter.section = { $in: elig.sections };
  if (elig.min_readiness_score) filter.readiness_score = { $gte: elig.min_readiness_score };

  let students = await studentRepo.findAll(filter, 'full_name roll_number department cgpa readiness_score readiness_tier user_id batch_year section');
  students.sort((a, b) => b.readiness_score - a.readiness_score);

  // Filter by required skills (verified) — AND logic
  if (elig.required_skills && elig.required_skills.length > 0) {
    const studentIds = students.map(s => s._id);
    const matches = await skillRepo.aggregate([
      { $match: {
          student_id: { $in: studentIds },
          status: 'verified',
          skill_name: { $in: elig.required_skills }
      }},
      { $group: { _id: '$student_id', count: { $sum: 1 } } },
      { $match: { count: { $gte: elig.required_skills.length } } }
    ]);
    const eligibleIds = new Set(matches.map(m => m._id.toString()));
    students = students.filter(s => eligibleIds.has(s._id.toString()));
  }

  return students;
}

/**
 * Check if a specific student is eligible for a drive.
 */
async function checkStudentEligibility(student, drive) {
  const reasons = [];
  const elig = drive.eligibility || {};

  if (elig.min_cgpa && student.cgpa < elig.min_cgpa) {
    reasons.push(`CGPA ${student.cgpa} < required ${elig.min_cgpa}`);
  }
  if (elig.batch_years && elig.batch_years.length && !elig.batch_years.includes(student.batch_year)) {
    reasons.push(`Batch year ${student.batch_year} not in ${elig.batch_years.join(', ')}`);
  }
  if (elig.departments && elig.departments.length && !elig.departments.includes(student.department)) {
    reasons.push(`Department ${student.department} not eligible`);
  }
  if (elig.sections && elig.sections.length && !elig.sections.includes(student.section)) {
    reasons.push(`Section ${student.section} not eligible`);
  }
  if (elig.min_readiness_score && student.readiness_score < elig.min_readiness_score) {
    reasons.push(`Readiness score ${student.readiness_score} < required ${elig.min_readiness_score}`);
  }

  // Check required skills
  if (elig.required_skills && elig.required_skills.length > 0) {
    const verifiedSkills = await skillRepo.findVerifiedByStudent(student._id);
    const missingSkills = elig.required_skills.filter(
      s => !verifiedSkills.some(vs => vs.skill_name === s)
    );
    if (missingSkills.length > 0) {
      reasons.push(`Missing verified skills: ${missingSkills.join(', ')}`);
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

module.exports = { findEligibleStudents, checkStudentEligibility };
