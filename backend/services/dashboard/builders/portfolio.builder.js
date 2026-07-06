/**
 * Portfolio Builder
 * Single query helper to grab counts for portfolio items.
 */
const Skill = require('../../../models/Skill');
const Project = require('../../../models/Project');
const Internship = require('../../../models/Internship');
const Certification = require('../../../models/Certification');
const Achievement = require('../../../models/Achievement');

function calculateProgress(verified, total) {
  if (total === 0) return 0;
  return Math.round((verified / total) * 100);
}

async function buildPortfolio(studentId) {
  // Execute all aggregations in parallel
  const [
    skills,
    projects,
    internships,
    certifications,
    achievements
  ] = await Promise.all([
    Skill.aggregate([
      { $match: { student_id: studentId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Project.aggregate([
      { $match: { created_by: studentId } }, // Projects can have multiple student_ids, but using created_by or student_ids
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Internship.aggregate([
      { $match: { student_id: studentId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Certification.aggregate([
      { $match: { student_id: studentId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    Achievement.aggregate([
      { $match: { student_id: studentId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ])
  ]);

  const mapCounts = (agg, verifiedKey = 'verified', pendingKey = 'pending') => {
    let verified = 0;
    let pending = 0;
    agg.forEach(group => {
      if (group._id === verifiedKey) verified = group.count;
      else if (group._id === pendingKey) pending = group.count;
      // other statuses like 'rejected' are just part of total if we want, 
      // but usually progress is verified / (verified + pending)
    });
    const total = verified + pending;
    return {
      total,
      verified,
      pending,
      progress: calculateProgress(verified, total)
    };
  };

  const skillsData = mapCounts(skills);
  const projectsData = mapCounts(projects, 'reviewed', 'pending');
  const internshipsData = mapCounts(internships);
  const certsData = mapCounts(certifications);
  const achievesData = mapCounts(achievements);

  const totalOverall = skillsData.total + projectsData.total + internshipsData.total + certsData.total + achievesData.total;
  const verifiedOverall = skillsData.verified + projectsData.verified + internshipsData.verified + certsData.verified + achievesData.verified;

  return {
    overall: calculateProgress(verifiedOverall, totalOverall),
    skills: skillsData,
    projects: projectsData,
    internships: internshipsData,
    certifications: certsData,
    achievements: achievesData
  };
}

module.exports = { buildPortfolio };
