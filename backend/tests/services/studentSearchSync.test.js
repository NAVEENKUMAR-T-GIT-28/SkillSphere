const { syncStudentSearch } = require('../../services/studentSearchSync');
const StudentSearch = require('../../models/StudentSearch');
const {
  createStudent,
  createTaxonomySkill,
  createSkill,
  createCertification,
  createProject,
  createInternship,
  createResume
} = require('../helpers/factories');

describe('studentSearchSync service', () => {
  test('returns null for a non-existent student', async () => {
    const mongoose = require('mongoose');
    const result = await syncStudentSearch(new mongoose.Types.ObjectId());
    expect(result).toBeNull();
  });

  test('creates a StudentSearch document with denormalized fields from live sources', async () => {
    const { student } = await createStudent({ full_name: 'Sync Target', cgpa: 8.7 });

    const tax = await createTaxonomySkill({ name: 'Golang' });
    await createSkill(student._id, tax._id, { skill_name: 'Golang', status: 'verified' });

    // A pending skill should NOT be counted as verified.
    const tax2 = await createTaxonomySkill({ name: 'Rust' });
    await createSkill(student._id, tax2._id, { skill_name: 'Rust', status: 'pending' });

    await createCertification(student._id, { title: 'GCP Associate', status: 'verified' });
    await createProject(student._id, { title: 'Sync Test Project', tech_stack: ['Go', 'Docker'] });
    await createInternship(student._id, { company: 'SyncCo', role: 'Backend Intern', status: 'verified' });
    await createResume(student._id, { is_latest: true, ats_score: 82 });

    const doc = await syncStudentSearch(student._id);

    expect(doc).not.toBeNull();
    expect(doc.name).toBe('Sync Target');
    expect(doc.cgpa).toBe(8.7);
    expect(doc.verified_skills).toContain('Golang');
    expect(doc.verified_skills).not.toContain('Rust');
    expect(doc.verified_certifications).toContain('GCP Associate');
    expect(doc.tech_stack).toEqual(expect.arrayContaining(['Go', 'Docker']));
    expect(doc.internship_count).toBe(1);
    expect(doc.project_count).toBe(1);
    expect(doc.resume_ats_score).toBe(82);

    const persisted = await StudentSearch.findOne({ student_id: student._id });
    expect(persisted).not.toBeNull();
    expect(persisted.synced_at).toBeInstanceOf(Date);
  });

  test('upserts (does not duplicate) on repeated sync calls', async () => {
    const { student } = await createStudent({ full_name: 'Repeat Sync' });

    await syncStudentSearch(student._id);
    await syncStudentSearch(student._id);

    const docs = await StudentSearch.find({ student_id: student._id });
    expect(docs.length).toBe(1);
  });

  test('reflects updated cgpa on re-sync', async () => {
    const Student = require('../../models/Student');
    const { student } = await createStudent({ full_name: 'Rescored Student', cgpa: 6.0 });

    await syncStudentSearch(student._id);
    await Student.findByIdAndUpdate(student._id, { cgpa: 9.9 });
    const updatedDoc = await syncStudentSearch(student._id);

    expect(updatedDoc.cgpa).toBe(9.9);
  });
});
