const request = require('supertest');
const express = require('express');
const myAccessRoutes = require('../../routes/myAccess');
const { createStudent, createFaculty } = require('../helpers/factories');
const { errorHandler } = require('../../middleware/errorHandler');
const RoleAssignment = require('../../models/RoleAssignment');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  try {
    req.user = JSON.parse(Buffer.from(authHeader.split(' ')[1], 'base64').toString());
  } catch(e) {}
  next();
});
app.use('/api/my', myAccessRoutes);
app.use(errorHandler);

describe('My Access Routes - Comprehensive', () => {
  let facultyToken, facultyUser;
  let studentToken, studentUser;
  let s1;

  beforeAll(async () => {
    const f = await createFaculty();
    facultyToken = f.token;
    facultyUser = f.user;

    const st = await createStudent({ department: 'CSE', section: 'A', batch_year: 2025 });
    studentToken = st.token;
    studentUser = st.user;
    s1 = st.student;

    // Assign faculty as mentor to student
    await RoleAssignment.create({
      user_id: facultyUser._id,
      role: 'mentor',
      scope_type: 'student',
      scope_id: s1._id,
      scope_label: 'Mentor for Student 1',
      assigned_by: facultyUser._id
    });
  });

  describe('GET /api/my/mentees', () => {
    test('Missing token (401)', async () => {
      const res = await request(app).get('/api/my/mentees');
      expect(res.status).toBe(401);
    });

    test('Student rejected (403)', async () => {
      const res = await request(app).get('/api/my/mentees').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('Success faculty gets mentees', async () => {
      const res = await request(app).get('/api/my/mentees').set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/my/class', () => {
    test('No role assigned (403)', async () => {
      const res = await request(app).get('/api/my/class').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ROLE_NOT_ASSIGNED');
    });

    test('Success with structured scope_data', async () => {
      await RoleAssignment.create({
        user_id: studentUser._id,
        role: 'rep',
        scope_type: 'class',
        scope_label: 'Class Rep',
        scope_data: { department: 'CSE', section: 'A', batch_year: 2025 },
        assigned_by: facultyUser._id
      });

      const res = await request(app).get('/api/my/class').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Validation: Invalid legacy format (400)', async () => {
      const f2 = await createFaculty();
      await RoleAssignment.create({
        user_id: f2.user._id,
        role: 'cc',
        scope_type: 'class',
        scope_label: 'Invalid-Format',
        assigned_by: facultyUser._id
      });

      const res = await request(app).get('/api/my/class').set('Authorization', `Bearer ${f2.token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_SCOPE');
    });
  });
});
