const resumeRepo = require('../../repositories/resumeRepo');

const build = async (studentId) => {
  const resume = await resumeRepo.findLatestByStudentId(studentId);
  if (!resume) return {};
  
  return {
    ats: {
      score: resume.ats_score || 0,
      grade: resume.ats_grade || 'F',
      analyzed_at: resume.last_analyzed_at || new Date()
    }
  };
};
module.exports = { build };
