const skillRepo = require('../../repositories/skillRepo');
const projectRepo = require('../../repositories/projectRepo');
const internshipRepo = require('../../repositories/internshipRepo');
const certificationRepo = require('../../repositories/certificationRepo');

const build = async (studentId) => {
  const [skills, projects, internships, certs] = await Promise.all([
    skillRepo.findVerifiedByStudent(studentId),
    projectRepo.findByStudentIds(studentId),
    internshipRepo.findVerifiedByStudent(studentId),
    certificationRepo.findVerifiedByStudent(studentId)
  ]);
  
  const verified_skill_count = skills.length;
  const project_count = projects.length;
  const internship_count = internships.length;
  const certification_count = certs.length;
  
  // Simple completion heuristic
  const completion = Math.min(100, (verified_skill_count * 2) + (project_count * 5) + (internship_count * 10) + (certification_count * 5));
  
  return {
    portfolio: {
      completion,
      project_count,
      internship_count,
      certification_count,
      verified_skill_count
    }
  };
};
module.exports = { build };
