const studentRepo = require('../../repositories/studentRepo');

const build = async (studentId) => {
  const student = await studentRepo.findById(studentId);
  if (!student) return null;

  return {
    identity: {
      student_id: student._id,
      user_id: student.user_id,
      full_name: student.full_name,
      roll_number: student.roll_number,
      register_number: student.register_number,
      avatar: student.profile_photo_url || ''
    }
  };
};

module.exports = { build };
