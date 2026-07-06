/**
 * Dashboard DTO
 * Guarantees the contract structure for the frontend.
 */

function fromDashboardData(data) {
  const {
    hero,
    ats,
    coding,
    portfolio,
    mentor,
    placements,
    notifications,
    timeline,
    tasks,
    careerHealth,
    system
  } = data;

  // Derive profile completion properly - this could be more complex but we use a placeholder heuristic here.
  // Actually, hero.student gives us fields we can check
  let filledFields = 0;
  const totalFields = 6; // name, avatar, department, batch, semester, cgpa
  if (hero.student.name) filledFields++;
  if (hero.student.avatar) filledFields++;
  if (hero.student.department && hero.student.department !== 'Unknown') filledFields++;
  if (hero.student.batch && hero.student.batch !== 'Unknown') filledFields++;
  if (hero.student.semester) filledFields++;
  if (hero.student.cgpa) filledFields++;

  const profileScore = Math.round((filledFields / totalFields) * 100);

  return {
    hero: {
      greeting: "Good Morning", // Handled by frontend, leaving as placeholder fallback
      quote: hero.quote,
      student: {
        id: hero.student.id,
        name: hero.student.name,
        avatar: hero.student.avatar,
        department: hero.student.department,
        batch: hero.student.batch,
        semester: hero.student.semester,
        cgpa: hero.student.cgpa
      }
    },

    quick_scores: {
      profile_completion: {
        score: profileScore,
        status: profileScore >= 90 ? "Excellent" : (profileScore >= 70 ? "Good" : "Needs Improvement")
      },
      ats: {
        enabled: ats.enabled,
        beta: ats.beta,
        score: ats.score,
        grade: ats.grade
      },
      coding_dna: {
        score: coding._dnaScore,
        status: coding._dnaScore >= 80 ? "Excellent" : (coding._dnaScore >= 50 ? "Good" : "Keep Practicing")
      },
      readiness: {
        enabled: false,
        coming_soon: true,
        score: null
      }
    },

    career_health: careerHealth,

    portfolio: {
      overall: portfolio.overall,
      skills: portfolio.skills,
      projects: portfolio.projects,
      internships: portfolio.internships,
      certifications: portfolio.certifications,
      achievements: portfolio.achievements
    },

    coding: {
      leetcode: coding.leetcode,
      hackerrank: coding.hackerrank,
      skillrack: coding.skillrack,
      github: coding.github
    },

    mentor: mentor ? {
      id: mentor.id,
      name: mentor.name,
      avatar: mentor.avatar,
      department: mentor.department,
      email: mentor.email,
      feedback: mentor.feedback
    } : null,

    placements: {
      upcoming: placements.upcoming
    },

    notifications: {
      unread: notifications.unread,
      items: notifications.items
    },

    tasks,

    timeline,
    
    system
  };
}

module.exports = { fromDashboardData };
