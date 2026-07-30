const studentRepo = require('../../repositories/studentRepo');

const build = async (studentId) => {
  const student = await studentRepo.findById(studentId);
  if (!student) return {};
  
  return {
    academic: {
      academic_status: student.academic_status || 'ENROLLED',
      cgpa: student.cgpa || 0,
      active_backlogs: student.current_backlogs || 0,
      latest_semester: student.semester || 1
    }
  };
};
module.exports = { build };
