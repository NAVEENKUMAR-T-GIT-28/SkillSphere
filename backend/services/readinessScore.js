// services/readinessScore.js
// Recalculated every time a verification action happens.

const skillRepo = require('../repositories/skillRepo');
const certificationRepo = require('../repositories/certificationRepo');
const projectRepo = require('../repositories/projectRepo');
const codingProfileRepo = require('../repositories/codingProfileRepo');
const studentRepo = require('../repositories/studentRepo');
const readinessHistoryRepo = require('../repositories/readinessHistoryRepo');
const SkillRackScore = require('../models/SkillRackScore');

const recalculateScore = async (studentId) => {
  // 1. Verified skills score (max 20)
  const verifiedSkills = await skillRepo.findVerifiedByStudent(studentId);
  const skillScore = Math.min(verifiedSkills.length * 2.5, 20);

  // 2. Certifications score (max 20)
  const verifiedCerts = await certificationRepo.findVerifiedByStudent(studentId);
  const certScore = Math.min(verifiedCerts.length * 5, 20);

  // 3. Projects score (max 25) — tier points only
  const projects = await projectRepo.findReviewedByStudent(studentId);
  let projectScore = 0;
  for (const p of projects) {
    const tierPoints = { basic: 5, intermediate: 8, advanced: 12 }[p.complexity_tier] || 0;
    projectScore += tierPoints;
  }
  projectScore = Math.min(projectScore, 25);

  // 4. Coding score (max 15)
  // Non-SkillRack platforms contribute up to 7.5
  // SkillRack contributes up to 7.5 (scaled from its 0-10 score)
  const codingProfiles = await codingProfileRepo.findAllLegacy(studentId);
  const nonSrProblems = codingProfiles
    .filter(cp => cp.platform !== 'skillrack')
    .reduce((sum, cp) => sum + (cp.problems_solved || 0), 0);

  const srScore = await SkillRackScore.findOne({ student_id: studentId });
  const srContribution = srScore ? (srScore.final_score / 10) * 7.5 : 0;
  const nonSrContribution = Math.min(nonSrProblems / 20, 7.5);
  const codingScore = Math.min(srContribution + nonSrContribution, 15);

  // 5. Faculty assessment score (max 5)
  const ratedProjects = projects.filter(p => p.faculty_rating?.average);
  const facultyScore = ratedProjects.length > 0
    ? Math.min(
        ratedProjects.reduce((s, p) => s + p.faculty_rating.average, 0) / ratedProjects.length,
        5
      )
    : 0;

  // Total
  const total = Math.round(skillScore + certScore + projectScore + codingScore + facultyScore);

  // Tier classification
  const tier =
    total >= 85 ? 'industry_ready' :
    total >= 65 ? 'placement_ready' :
    total >= 40 ? 'developing' : 'beginner';

  // Update student document
  await studentRepo.updateById(studentId, {
    readiness_score: total,
    readiness_tier: tier
  });

  // Save snapshot to history
  await readinessHistoryRepo.create({
    student_id: studentId,
    score: total,
    tier,
    breakdown: {
      skills_score: Math.round(skillScore * 100) / 100,
      certs_score: Math.round(certScore * 100) / 100,
      projects_score: Math.round(projectScore * 100) / 100,
      coding_score: Math.round(codingScore * 100) / 100,
      faculty_score: Math.round(facultyScore * 100) / 100
    },
    calculated_at: new Date()
  });

  return {
    score: total,
    tier,
    breakdown: {
      skills_score: Math.round(skillScore * 100) / 100,
      certs_score: Math.round(certScore * 100) / 100,
      projects_score: Math.round(projectScore * 100) / 100,
      coding_score: Math.round(codingScore * 100) / 100,
      faculty_score: Math.round(facultyScore * 100) / 100
    }
  };
};

module.exports = { recalculateScore };
