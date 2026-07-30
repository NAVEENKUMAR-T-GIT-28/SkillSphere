const mongoose = require('mongoose');
const { recomputePeerGroup } = require('../../services/skillrackScoring');
const CodingProfile = require('../../models/CodingProfile');
const Student = require('../../models/Student');
const Class = require('../../models/Class');
const SkillRackScore = require('../../models/SkillRackScore');

describe('SkillRack Scoring Service', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect('mongodb://127.0.0.1:27017/skillsphere_test_sr', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await CodingProfile.deleteMany({});
    await Student.deleteMany({});
    await Class.deleteMany({});
    await SkillRackScore.deleteMany({});
  });

  test('recomputePeerGroup correctly maps fields from platforms.skillrack.data', async () => {
    const cls = await Class.create({
      display_name: 'Test Class',
      department: 'CSE',
      batch_year: 2024,
      semester: 1,
      section: 'A',
      current_semester: 1,
      current_year: 1,
      status: 'ACTIVE'
    });

    const student = await Student.create({
      full_name: 'Test Student',
      roll_number: 'TEST001',
      class_id: cls._id,
      department: 'CSE',
      batch_year: 2024,
      semester: 1,
      section: 'A',
      cgpa: 9.0
    });

    await CodingProfile.create({
      student_id: student._id,
      platforms: {
        skillrack: {
          username: 'testuser',
          data: {
            codeTrack: 50,
            dc: 10,
            dt: 5,
            codeTest: 20,
            codeTutor: 15,
            solved: 100,
            certificates: 2,
            points: 1500,
            badges: { gold: 1, silver: 2, bronze: 3 }
          }
        }
      }
    });

    await recomputePeerGroup(cls._id);

    const score = await SkillRackScore.findOne({ student_id: student._id });
    expect(score).not.toBeNull();
    
    expect(score.raw_points).toBe(1500);
    expect(score.certificates).toBe(2);
    expect(score.base_score).toBe(9.0);
    expect(score.final_score).toBeGreaterThan(0);
  });
});
