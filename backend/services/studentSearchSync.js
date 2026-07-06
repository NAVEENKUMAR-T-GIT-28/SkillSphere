/**
 * StudentSearch Sync Service
 * Rebuilds one StudentSearch document from live source collections.
 * Called fire-and-forget after any write to Student, Skill,
 * Certification, Project, Internship, or Resume for that student.
 * This is a best-effort cache rebuild, not a transaction — search staleness of
 * a few seconds is acceptable; incorrect writes to source data are NOT.
 *
 * Intentionally NOT synced in this phase:
 *   - CodingProfile → coding_platforms (Ground Rule #3: CodingProfile out of scope)
 *   - Application → is_placed, company_placed, package_lpa, placement_status
 *     (deferred until Application write paths are explicitly approved)
 *   - Achievement data (not represented in StudentSearch schema; deferred for future phases)
 */

const studentRepo = require('../repositories/studentRepo');
const skillRepo = require('../repositories/skillRepo');
const certificationRepo = require('../repositories/certificationRepo');
const projectRepo = require('../repositories/projectRepo');
const internshipRepo = require('../repositories/internshipRepo');
const resumeRepo = require('../repositories/resumeRepo');
const studentSearchRepo = require('../repositories/studentSearchRepo');

const codingProfileRepo = require('../repositories/codingProfileRepo');

async function syncStudentSearch(studentId) {
  const student = await studentRepo.findById(studentId).populate('class_id');
  if (!student) return null;

  const [skills, certs, projects, internships, latestResume, codingProfile] = await Promise.all([
    skillRepo.findVerifiedByStudent(studentId),
    certificationRepo.findVerifiedByStudent(studentId),
    projectRepo.findByStudentIds(studentId),
    internshipRepo.findVerifiedByStudent(studentId),
    resumeRepo.findLatestByStudentId(studentId),
    codingProfileRepo.findByStudentId(studentId)
  ]);

  const doc = {
    student_id: student._id,
    name: student.full_name,
    roll_number: student.roll_number,
    cgpa: student.cgpa,
    department: student.class_id?.department,
    semester: student.class_id?.semester,
    batch_year: student.class_id?.batch_year,
    graduation_year: student.class_id?.graduation_year,
    section: student.class_id?.section,
    current_backlogs: student.current_backlogs || 0,
    readiness_score: student.readiness_score,
    readiness_tier: student.readiness_tier,
    preferred_job_role: student.preferred_job_role,

    verified_skills: skills.map(s => s.skill_name),
    verified_certifications: certs.map(c => c.title),
    tech_stack: [...new Set(projects.flatMap(p => p.tech_stack || []))],
    coding_platforms: codingProfile && codingProfile.platforms ? Object.keys(codingProfile.platforms).filter(k => codingProfile.platforms[k] !== null) : [],

    internship_count: internships.length,
    project_count: projects.length,
    resume_ats_score: latestResume?.ats_score,
    has_resume: !!latestResume,

    synced_at: new Date()
  };

  return studentSearchRepo.findOneAndUpdate(
    { student_id: studentId },
    doc,
    { upsert: true, new: true, runValidators: true }
  );
}

module.exports = { syncStudentSearch };
