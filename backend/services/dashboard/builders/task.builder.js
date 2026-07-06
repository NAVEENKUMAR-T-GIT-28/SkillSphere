/**
 * Task Builder
 * Generates tasks dynamically based on the state of the student's profile.
 * Designed to be easily extendable by future AI modules.
 */

function buildTasks(heroData, atsData, codingData, portfolioData) {
  const tasks = [];
  
  // 1. Profile Completion
  // Checking if there are missing fields in the student's profile
  // For the dashboard, we use a basic heuristic based on what hero returned
  if (!heroData.student.avatar || heroData.student.cgpa === null) {
    tasks.push({
      id: 'task_profile',
      title: 'Complete Profile',
      priority: 'high',
      completed: false,
      action: '/profile'
    });
  }

  // 2. Resume Upload
  if (!atsData.enabled) {
    tasks.push({
      id: 'task_resume',
      title: 'Upload Resume',
      priority: 'high',
      completed: false,
      action: '/resumes'
    });
  }

  // 3. Verify Skills
  if (portfolioData.skills.total > 0 && portfolioData.skills.pending > 0) {
    tasks.push({
      id: 'task_verify_skills',
      title: 'Verify Pending Skills',
      priority: 'medium',
      completed: false,
      action: '/skills'
    });
  } else if (portfolioData.skills.total === 0) {
    tasks.push({
      id: 'task_add_skills',
      title: 'Add Skills',
      priority: 'medium',
      completed: false,
      action: '/skills'
    });
  }

  // 4. Add Project
  if (portfolioData.projects.total === 0) {
    tasks.push({
      id: 'task_add_project',
      title: 'Add a Project',
      priority: 'high',
      completed: false,
      action: '/projects'
    });
  }

  // 5. Connect GitHub
  if (!codingData.github.connected) {
    tasks.push({
      id: 'task_connect_github',
      title: 'Sync GitHub',
      priority: 'medium',
      completed: false,
      action: '/coding-profiles'
    });
  }

  // 6. LeetCode Practice
  if (codingData.leetcode.connected && codingData.leetcode.solved < 50) {
    tasks.push({
      id: 'task_leetcode',
      title: 'Solve 2 LeetCode Problems',
      priority: 'low',
      completed: false,
      action: '/coding-profiles' // Or direct to leetcode
    });
  }

  // Return the top 3 or 4 highest priority tasks
  // For now, sorting logic: high > medium > low
  const priorityScore = { high: 3, medium: 2, low: 1 };
  tasks.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);

  return tasks.slice(0, 4);
}

module.exports = { buildTasks };
