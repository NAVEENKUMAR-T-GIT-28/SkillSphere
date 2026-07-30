/**
 * Dashboard Service
 * Pure orchestration. Executes all builders in parallel using Promise.allSettled.
 */
const { buildHero } = require('./builders/hero.builder');
const { buildAts } = require('./builders/ats.builder');
const { buildCoding } = require('./builders/coding.builder');
const { buildPortfolio } = require('./builders/portfolio.builder');
const { buildMentor } = require('./builders/mentor.builder');
const { buildPlacements } = require('./builders/placement.builder');
const { buildNotifications } = require('./builders/notification.builder');
const { buildTimeline } = require('./builders/timeline.builder');
const { buildTasks } = require('./builders/task.builder');
const { buildCareerHealth } = require('./builders/careerHealth.builder');
const { fromDashboardData } = require('./dashboard.dto');

const studentSearchRepo = require('../../repositories/studentSearchRepo');
const Student = require('../../models/Student'); // Needed to get the initial student object

async function getDashboardData(userId) {
  // 1. Fetch StudentSearch first
  const searchDoc = await studentSearchRepo.findByUser(userId);
  if (!searchDoc) {
    const error = new Error('Student profile not found');
    error.statusCode = 404;
    throw error;
  }

  // Fallback to studentId string for legacy builders
  const studentId = searchDoc.identity.student_id.toString();

  // 2. Parallelize all independent builder queries
  const [
    heroData,
    atsData,
    codingData,
    portfolioData,
    mentorData,
    placementsData,
    notificationsData,
    timelineData
  ] = await Promise.all([
    buildHero(searchDoc),
    buildAts(searchDoc),
    buildCoding(searchDoc),
    buildPortfolio(searchDoc),
    buildMentor(studentId),
    buildPlacements(searchDoc, studentId),
    buildNotifications(studentId),
    buildTimeline(studentId)
  ]);

  // 3. Dependent Builders (Tasks & Career Health rely on data from previous steps)
  const tasksData = buildTasks(heroData, atsData, codingData, portfolioData);
  
  // Profile Completion approximation for Career Health
  let filledFields = 0;
  if (heroData.student.name) filledFields++;
  if (heroData.student.avatar) filledFields++;
  if (heroData.student.department && heroData.student.department !== 'Unknown') filledFields++;
  if (heroData.student.batch && heroData.student.batch !== 'Unknown') filledFields++;
  if (heroData.student.semester) filledFields++;
  if (heroData.student.cgpa) filledFields++;
  const profileScore = Math.round((filledFields / 6) * 100);

  const careerHealthData = buildCareerHealth(
    profileScore,
    atsData.score,
    codingData._dnaScore,
    portfolioData.overall
  );

  // 4. System block
  const system = {
    dashboard_version: '2.0.0',
    generated_at: new Date(),
    cache: 'miss'
  };

  // 5. Transform via DTO
  return fromDashboardData({
    hero: heroData,
    ats: atsData,
    coding: codingData,
    portfolio: portfolioData,
    mentor: mentorData,
    placements: placementsData,
    notifications: notificationsData,
    timeline: timelineData,
    tasks: tasksData,
    careerHealth: careerHealthData,
    system
  });
}

module.exports = { getDashboardData };
