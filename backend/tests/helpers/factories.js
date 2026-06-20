const mongoose = require('mongoose');
const User = require('../../models/User');
const Student = require('../../models/Student');
const Faculty = require('../../models/Faculty');
const SkillTaxonomy = require('../../models/SkillTaxonomy');
const Skill = require('../../models/Skill');
const Certification = require('../../models/Certification');
const Project = require('../../models/Project');
const CodingProfile = require('../../models/CodingProfile');
const RoleAssignment = require('../../models/RoleAssignment');
const PlacementDrive = require('../../models/PlacementDrive');
const Class = require('../../models/Class');
const { generateToken } = require('./tokenHelper');

const createUser = async (overrides = {}) => {
  const defaults = {
    email: `user_${Date.now()}@test.com`,
    password: 'Password123',
    base_role: 'student'
  };
  return User.create({ ...defaults, ...overrides });
};

// ─── Students ───────────────────────────────────────────────────────────────

const createStudent = async (overrides = {}) => {
  const user = await createUser({ base_role: 'student' });
  let class_id = overrides.class_id;
  if (!class_id) {
    const classData = {
      department: overrides.department || 'Computer Science',
      section: overrides.section || `A-${Math.floor(Math.random() * 100000)}`,
      batch_year: overrides.batch_year || 2023,
      graduation_year: overrides.graduation_year || 2027,
      academic_year: 3,
      semester: 6
    };
    let cls = await Class.findOne({ department: classData.department, section: classData.section, batch_year: classData.batch_year });
    if (!cls) {
      cls = await Class.create(classData);
    }
    class_id = cls._id;
  }
  const student = await Student.create({
    user_id: user._id,
    class_id,
    full_name: 'Test Student',
    roll_number: `ROLL${Date.now()}`,
    department: 'Computer Science',
    batch_year: 2023,
    graduation_year: 2027,
    section: 'A',
    semester: 6,
    cgpa: 8.0,
    ...overrides
  });
  return { user, student, token: generateToken(user._id, 'student') };
};

// ─── Faculty ────────────────────────────────────────────────────────────────

const createFaculty = async (overrides = {}) => {
  const user = await createUser({ base_role: 'faculty' });
  const faculty = await Faculty.create({
    user_id: user._id,
    full_name: 'Test Faculty',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    employee_id: `EMP${Date.now()}`,
    ...overrides
  });
  return { user, faculty, token: generateToken(user._id, 'faculty') };
};

// ─── HOD ────────────────────────────────────────────────────────────────────

const createHOD = async (overrides = {}) => {
  const user = await createUser({ base_role: 'hod' });
  const faculty = await Faculty.create({
    user_id: user._id,
    full_name: 'Test HOD',
    department: 'Computer Science',
    designation: 'Head of Department',
    employee_id: `HOD${Date.now()}`,
    ...overrides
  });
  return { user, faculty, token: generateToken(user._id, 'hod') };
};

// ─── Skill Taxonomy ──────────────────────────────────────────────────────────

const createTaxonomySkill = async (overrides = {}) => {
  return SkillTaxonomy.create({
    name: `Skill_${Date.now()}`,
    category: 'programming',
    is_trending: false,
    is_active: true,
    ...overrides
  });
};

// ─── Skill (student skill) ───────────────────────────────────────────────────

const createSkill = async (studentId, taxonomyId, overrides = {}) => {
  return Skill.create({
    student_id: studentId,
    taxonomy_id: taxonomyId,
    skill_name: 'JavaScript',
    proficiency: 'intermediate',
    status: 'pending',
    ...overrides
  });
};

// ─── Certification ───────────────────────────────────────────────────────────

const createCertification = async (studentId, overrides = {}) => {
  return Certification.create({
    student_id: studentId,
    title: 'AWS Certified',
    issuer: 'Amazon',
    category: 'technical',
    issue_date: new Date('2024-01-01'),
    drive_link: 'https://drive.google.com/file/d/test123',
    status: 'pending',
    ...overrides
  });
};

// ─── Project ────────────────────────────────────────────────────────────────

const createProject = async (studentId, overrides = {}) => {
  return Project.create({
    student_ids: [studentId],
    created_by: studentId,
    title: 'Test Project',
    tech_stack: ['React.js', 'Node.js'],
    github_url: 'https://github.com/test/repo',
    complexity_tier: 'intermediate',
    status: 'pending',
    ...overrides
  });
};

// ─── CodingProfile ──────────────────────────────────────────────────────────

const createCodingProfile = async (studentId, overrides = {}) => {
  return CodingProfile.create({
    student_id: studentId,
    platform: 'leetcode',
    username: 'testuser',
    profile_url: 'https://leetcode.com/testuser',
    problems_solved: 50,
    ...overrides
  });
};

// ─── PlacementDrive ─────────────────────────────────────────────────────────

const createPlacementDrive = async (createdBy, overrides = {}) => {
  return PlacementDrive.create({
    created_by: createdBy,
    company_name: 'Acme Corp',
    role_title: 'Software Engineer',
    drive_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    application_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    drive_type: 'oncampus',
    status: 'active',
    eligibility: { min_cgpa: 7.0 },
    ...overrides
  });
};

// ─── Class ──────────────────────────────────────────────────────────────────

const createClass = async (overrides = {}) => {
  const uniqueId = Math.floor(Math.random() * 100000);
  return Class.create({
    department: 'Computer Science',
    section: `A-${uniqueId}`,
    batch_year: 2023,
    graduation_year: 2027,
    academic_year: 3,
    semester: 6,
    ...overrides
  });
};

module.exports = {
  createUser, createStudent, createFaculty, createHOD,
  createTaxonomySkill, createSkill, createCertification,
  createProject, createCodingProfile, createPlacementDrive,
  createClass
};
