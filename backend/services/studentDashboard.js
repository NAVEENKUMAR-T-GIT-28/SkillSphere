/**
 * services/studentDashboard.js
 * Student dashboard assembly workflow.
 * Orchestrates readiness score, notification fetch, and dashboard shape construction.
 */

const studentRepo = require('../repositories/studentRepo');
const notificationRepo = require('../repositories/notificationRepo');
const { recalculateScore } = require('./readinessScore');

/**
 * Assembles the full student dashboard payload.
 * Throws structured errors for invalid access or missing profile.
 */
const buildDashboard = async (userId, baseRole) => {
  if (baseRole !== 'student') {
    const err = new Error('Only students can access this dashboard');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  const student = await studentRepo.findByUserId(userId);
  if (!student) {
    const err = new Error('Student profile not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const scoreData = await recalculateScore(student._id);
  const notifications = await notificationRepo.findByUserId(userId, {}, 0, 3);

  return {
    readiness: {
      score: scoreData.score,
      tier: scoreData.tier,
      guidance: 'Keep improving your profile across all pillars to reach the next tier.',
      skills: { verified: scoreData.breakdown.skills_score, total: 20 },
      certs: { verified: scoreData.breakdown.certs_score, total: 20 },
      projects: { count: scoreData.breakdown.projects_score },
      coding: { count: scoreData.breakdown.coding_score },
      faculty: { count: scoreData.breakdown.faculty_score }
    },
    modules: [
      { id: 'profile', name: 'Profile', description: `${student.profile_completeness || 0}% Complete`, status: student.profile_completeness >= 80 ? 'Good' : 'Needs attention', action: 'Update', href: '/profile' },
      { id: 'skills', name: 'Skills', description: `Score: ${scoreData.breakdown.skills_score}/20`, status: 'Active', action: 'Manage', href: '/skills' },
      { id: 'projects', name: 'Projects', description: `Score: ${scoreData.breakdown.projects_score}/25`, status: 'Active', action: 'View', href: '/projects' },
      { id: 'certs', name: 'Certifications', description: `Score: ${scoreData.breakdown.certs_score}/20`, status: 'Active', action: 'View', href: '/certifications' },
      { id: 'coding', name: 'Coding Profile', description: `Score: ${scoreData.breakdown.coding_score}/15`, status: 'Active', action: 'View', href: '/coding' }
    ],
    notifications: notifications.map(n => ({
      title: n.title, message: n.message, type: n.type, is_read: n.is_read, created_at: n.created_at
    }))
  };
};

module.exports = { buildDashboard };
