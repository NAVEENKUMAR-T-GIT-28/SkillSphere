const studentRepo = require('../../repositories/studentRepo');
const classRepo = require('../../repositories/classRepo');

const build = async (studentId) => {
  const student = await studentRepo.findById(studentId);
  if (!student || !student.class_id) return {};
  const cls = await classRepo.findById(student.class_id);
  if (!cls) return {};
  
  return {
    class: {
      id: cls._id,
      display_name: cls.display_name || `${cls.department} • Year ${cls.current_year} • Section ${cls.section}`,
      department: cls.department,
      current_year: cls.current_year,
      current_semester: cls.current_semester,
      section: cls.section,
      status: cls.status
    }
  };
};
module.exports = { build };
