/**
 * Readiness Score Service
 * Recalculated every time a verification action happens.
 * 
 * Score breakdown (max 100):
 *   Skills:   max 20  — 2.5 per verified skill (needs 8 for full)
 *   Certs:    max 20  — 5 per verified cert (needs 4 for full)
 *   Projects: max 25  — tier points + rating bonus
 *   Coding:   max 15  — 1 per 20 problems solved (needs 300 for full)
 *   Faculty:  max  5  — average of all faculty ratings
 * 
 * Tiers:
 *   0–39:  beginner
 *   40–64: developing
 *   65–84: placement_ready
 *   85+:   industry_ready
 */

const Skill = require('../models/Skill');
const Certification = require('../models/Certification');
const Project = require('../models/Project');
const CodingProfile = require('../models/CodingProfile');
const Student = require('../models/Student');
const ReadinessScoreHistory = require('../models/ReadinessScoreHistory');

const recalculateScore = async (studentId) => {
  // 1. Verified skills score (max 20)
  const verifiedSkills = await Skill.find({ student_id: studentId, status: 'verified' });
  const skillScore = Math.min(verifiedSkills.length * 2.5, 20);
  // 2.5 per verified skill, capped at 20 (needs 8 verified skills for full marks)

  // 2. Certifications score (max 20)
  const verifiedCerts = await Certification.find({ student_id: studentId, status: 'verified' });
  const certScore = Math.min(verifiedCerts.length * 5, 20);
  // 5 per verified cert, capped at 20 (needs 4 certs for full marks)

  // 3. Projects score (max 25)
  const projects = await Project.find({ student_ids: studentId, status: 'reviewed' });
  let projectScore = 0;
  for (const p of projects) {
    const tierPoints = { basic: 5, intermediate: 8, advanced: 12 }[p.complexity_tier] || 0;
    const ratingBonus = p.faculty_rating?.average ? (p.faculty_rating.average / 5) * 3 : 0;
    projectScore += tierPoints + ratingBonus;
  }
  projectScore = Math.min(projectScore, 25);

  // 4. Coding score (max 15) — manual stats in MVP
  const codingProfiles = await CodingProfile.find({ student_id: studentId });
  const totalProblems = codingProfiles.reduce((sum, cp) => sum + (cp.problems_solved || 0), 0);
  const codingScore = Math.min(totalProblems / 20, 15);
  // 1 point per 20 problems, capped at 15 (needs 300 problems for full marks)

  // 5. Faculty assessment score (max 5)
  // Average of all faculty ratings across all reviewed projects
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
  await Student.findByIdAndUpdate(studentId, {
    readiness_score: total,
    readiness_tier: tier
  });

  // Save snapshot to history
  await ReadinessScoreHistory.create({
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
