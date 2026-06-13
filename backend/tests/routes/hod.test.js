const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const hodRoutes = require('../../routes/hod');
const { createStudent, createFaculty, createUser } = require('../helpers/factories');
const { errorHandler } = require('../../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  try {
    const token = authHeader.split(' ')[1];
    if (token === 'invalid-token') throw new Error('Invalid');
    req.user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch(e) {}
  next();
});
app.use('/api/hod', hodRoutes);
app.use(errorHandler);

describe('HOD Routes - Comprehensive', () => {
  let hodToken, facultyToken, studentToken;
  let facultyUser, studentUser;
  let assignmentId;

  beforeAll(async () => {
    const hodUser = await createUser({ base_role: 'hod' });
    hodToken = require('../helpers/tokenHelper').generateToken(hodUser._id, 'hod');

    const f = await createFaculty();
    facultyToken = f.token;
    facultyUser = f.user;

    const s = await createStudent();
    studentToken = s.token;
    studentUser = s.user;
  });

  describe('GET /api/hod/dashboard', () => {
    test('Missing token (401)', async () => {
      const res = await request(app).get('/api/hod/dashboard');
      expect(res.status).toBe(401);
    });

    test('Faculty rejected (403)', async () => {
      const res = await request(app).get('/api/hod/dashboard').set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });

    test('Success', async () => {
      const res = await request(app).get('/api/hod/dashboard').set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.overview).toBeDefined();
    });
  });

  describe('GET /api/hod/students', () => {
    test('Success with filters', async () => {
      const res = await request(app).get('/api/hod/students?department=CSE&batch_year=2025').set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/hod/role-assignments', () => {
    test('Validation failure', async () => {
      const res = await request(app).post('/api/hod/role-assignments').set('Authorization', `Bearer ${hodToken}`).send({
        user_id: facultyUser._id, role: 'invalid_role'
      });
      expect(res.status).toBe(400);
    });

    test('Missing user', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).post('/api/hod/role-assignments').set('Authorization', `Bearer ${hodToken}`).send({
        user_id: fakeId, role: 'mentor', scope_type: 'class', scope_label: 'A'
      });
      expect(res.status).toBe(404);
    });

    test('Success assignment', async () => {
      const res = await request(app).post('/api/hod/role-assignments').set('Authorization', `Bearer ${hodToken}`).send({
        user_id: facultyUser._id, role: 'mentor', scope_type: 'class', scope_label: 'CS-A-2025'
      });
      expect(res.status).toBe(201);
      assignmentId = res.body.data._id;
    });

    test('Duplicate assignment', async () => {
      const res = await request(app).post('/api/hod/role-assignments').set('Authorization', `Bearer ${hodToken}`).send({
        user_id: facultyUser._id, role: 'mentor', scope_type: 'class', scope_label: 'CS-A-2025'
      });
      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/hod/role-assignments', () => {
    test('Success', async () => {
      const res = await request(app).get('/api/hod/role-assignments').set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/hod/role-assignments/:id', () => {
    test('Missing ID (404)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/hod/role-assignments/${fakeId}`).set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(404);
    });

    test('Success revoke', async () => {
      const res = await request(app).delete(`/api/hod/role-assignments/${assignmentId}`).set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(200);
    });

    test('Already revoked (400)', async () => {
      const res = await request(app).delete(`/api/hod/role-assignments/${assignmentId}`).set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/hod/users', () => {
    test('Success search', async () => {
      const res = await request(app).get('/api/hod/users?search=a&role=student').set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('Empty search returns empty array', async () => {
      const res = await request(app).get('/api/hod/users').set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });
});
