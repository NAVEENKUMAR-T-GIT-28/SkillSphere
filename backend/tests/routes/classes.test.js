const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Class = require('../../models/Class');
const Student = require('../../models/Student');
const User = require('../../models/User');
const { generateToken } = require('../helpers/tokenHelper');
const { createClass } = require('../helpers/factories');

let hodToken, facultyToken, studentToken;
let hodUser, facultyUser, studentUser;

beforeAll(async () => {
  hodUser = await User.create({ email: 'hod@test.com', password: 'password123', base_role: 'hod' });
  facultyUser = await User.create({ email: 'faculty@test.com', password: 'password123', base_role: 'faculty' });
  studentUser = await User.create({ email: 'student@test.com', password: 'password123', base_role: 'student' });

  hodToken = generateToken(hodUser._id, 'hod');
  facultyToken = generateToken(facultyUser._id, 'faculty');
  studentToken = generateToken(studentUser._id, 'student');
});

afterAll(async () => {
  await User.deleteMany({});
  await Class.deleteMany({});
  await Student.deleteMany({});
});

afterEach(async () => {
  await Class.deleteMany({});
  await Student.deleteMany({});
});

describe('Class Routes (/api/classes)', () => {
  
  describe('POST /api/classes', () => {
    it('should allow HOD to create a class', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          department: 'Computer Science',
          section: 'A',
          batch_year: 2023,
          graduation_year: 2027
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.department).toBe('Computer Science');
      expect(res.body.data.label).toBe('Computer Science-A-2023');
    });

    it('should reject non-HOD from creating a class', async () => {
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          department: 'Computer Science',
          section: 'A',
          batch_year: 2023,
          graduation_year: 2027
        });
      
      expect(res.statusCode).toBe(403);
    });

    it('should return 409 if class already exists', async () => {
      await createClass({ department: 'CSE', section: 'B', batch_year: 2023, graduation_year: 2027 });
      
      const res = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          department: 'CSE',
          section: 'B',
          batch_year: 2023,
          graduation_year: 2027
        });
        
      expect(res.statusCode).toBe(409);
    });
  });

  describe('GET /api/classes', () => {
    it('should list all active classes', async () => {
      await createClass({ department: 'CSE', section: 'A', batch_year: 2023, graduation_year: 2027 });
      await createClass({ department: 'CSE', section: 'B', batch_year: 2023, graduation_year: 2027 });
      await createClass({ department: 'IT', section: 'A', batch_year: 2022, graduation_year: 2026, is_active: false });

      const res = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${hodToken}`);
        
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2); // Only active ones
    });

    it('should filter by department and batch_year', async () => {
      await createClass({ department: 'CSE', section: 'A', batch_year: 2023, graduation_year: 2027 });
      await createClass({ department: 'IT', section: 'A', batch_year: 2023, graduation_year: 2027 });

      const res = await request(app)
        .get('/api/classes?department=CSE')
        .set('Authorization', `Bearer ${facultyToken}`);
        
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].department).toBe('CSE');
    });
  });

  describe('GET /api/classes/:id', () => {
    it('should return class details and enrolled students', async () => {
      const cls = await createClass({ department: 'CSE', section: 'A', batch_year: 2023, graduation_year: 2027 });
      
      await Student.create({
        user_id: studentUser._id,
        full_name: 'John Doe',
        roll_number: '101',
        class_id: cls._id,
        department: 'CSE',
        section: 'A',
        batch_year: 2023,
        graduation_year: 2027
      });

      const res = await request(app)
        .get(`/api/classes/${cls._id}`)
        .set('Authorization', `Bearer ${hodToken}`);
        
      expect(res.statusCode).toBe(200);
      expect(res.body.data.class._id).toBe(cls._id.toString());
      expect(res.body.data.students.length).toBe(1);
      expect(res.body.data.students[0].full_name).toBe('John Doe');
    });

    it('should return 404 for non-existent class', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/classes/${fakeId}`)
        .set('Authorization', `Bearer ${hodToken}`);
        
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/classes/:id', () => {
    it('should allow HOD to update class fields', async () => {
      const cls = await createClass({ department: 'CSE', section: 'A', batch_year: 2023, graduation_year: 2027 });
      
      const res = await request(app)
        .patch(`/api/classes/${cls._id}`)
        .set('Authorization', `Bearer ${hodToken}`)
        .send({ graduation_year: 2028, is_active: false });
        
      expect(res.statusCode).toBe(200);
      expect(res.body.data.graduation_year).toBe(2028);
      expect(res.body.data.is_active).toBe(false);
    });
  });

  describe('DELETE /api/classes/:id', () => {
    it('should soft-delete the class', async () => {
      const cls = await createClass({ department: 'CSE', section: 'A', batch_year: 2023, graduation_year: 2027 });
      
      const res = await request(app)
        .delete(`/api/classes/${cls._id}`)
        .set('Authorization', `Bearer ${hodToken}`);
        
      expect(res.statusCode).toBe(200);
      expect(res.body.data.class.is_active).toBe(false);

      const checkCls = await Class.findById(cls._id);
      expect(checkCls.is_active).toBe(false);
    });
  });
});