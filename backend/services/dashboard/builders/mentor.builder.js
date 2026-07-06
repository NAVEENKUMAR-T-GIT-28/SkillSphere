/**
 * Mentor Builder
 * Finds the student's assigned mentor and latest feedback.
 */
const RoleAssignment = require('../../../models/RoleAssignment');
const VerificationLog = require('../../../models/VerificationLog');
const Project = require('../../../models/Project');
const User = require('../../../models/User'); // Required to get email or avatar if present on user
const Faculty = require('../../../models/Faculty');

async function buildMentor(studentId) {
  // Find active mentor
  const assignment = await RoleAssignment.findOne({
    role: 'mentor',
    scope_type: 'student',
    scope_id: studentId,
    revoked_at: null
  }).lean();

  if (!assignment) return null;

  const mentorUserId = assignment.user_id;
  
  // Parallel fetch faculty details, user details (for email), and feedback
  const [faculty, user, verificationLog, latestProject] = await Promise.all([
    Faculty.findOne({ user_id: mentorUserId }).lean(),
    User.findById(mentorUserId).select('email profile_photo_url').lean(),
    VerificationLog.findOne({ student_id: studentId, actor_id: mentorUserId, comment: { $exists: true, $ne: "" } })
      .sort({ created_at: -1 })
      .lean(),
    Project.findOne({ 
      created_by: studentId, 
      "faculty_rating.rated_by": mentorUserId,
      "faculty_rating.feedback": { $exists: true, $ne: "" }
    })
      .sort({ "faculty_rating.rated_at": -1 })
      .lean()
  ]);

  if (!faculty) return null;

  // Determine latest feedback
  let feedback = null;
  const vTime = verificationLog ? new Date(verificationLog.created_at).getTime() : 0;
  const pTime = latestProject ? new Date(latestProject.faculty_rating.rated_at).getTime() : 0;

  if (vTime > 0 || pTime > 0) {
    if (vTime > pTime) {
      feedback = {
        message: verificationLog.comment,
        created_at: verificationLog.created_at
      };
    } else {
      feedback = {
        message: latestProject.faculty_rating.feedback,
        created_at: latestProject.faculty_rating.rated_at
      };
    }
  }

  return {
    id: faculty._id.toString(),
    name: faculty.full_name,
    avatar: user && user.profile_photo_url ? user.profile_photo_url : null,
    department: faculty.department,
    email: user ? user.email : "",
    feedback
  };
}

module.exports = { buildMentor };
