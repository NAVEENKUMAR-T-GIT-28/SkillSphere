const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const studentsRoutes = require('../../routes/students');
const { createStudent, createFaculty } = require('../helpers/factories');

const app = express();
app.use(express.json());
// Mock generic req object properties (usually set by earlier middleware)
app.use((req, res, next) => {
  req.user = req.headers.authorization 
    ? JSON.parse(Buffer.from(req.headers.authorization.split('.')[1], 'base64').toString()) 
    : undefined;
  next();
});
app.use('/api/students', studentsRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ success: false, error: { message: err.message, code: err.code } });
});

describe('Students Routes', () => {
  let student1, token1;
  let student2, token2;
  let faculty, facultyToken;

  beforeAll(async () => {
    const s1 = await createStudent();
    student1 = s1.student;
    token1 = s1.token;

    const s2 = await createStudent();
    student2 = s2.student;
    token2 = s2.token;

    const f1 = await createFaculty();
    faculty = f1.faculty;
    facultyToken = f1.token;
  });

  describe('GET /api/students/dashboard', () => {
    test('successfully retrieves dashboard for student', async () => {
      const res = await request(app)
        .get('/api/students/dashboard')
        .set('Authorization', `Bearer ${token1}`);
      expect(res.status).toBe(200);
      expect(res.body.data.readiness).toBeDefined();
    });

    test('blocks faculty from accessing student dashboard', async () => {
      const res = await request(app)
        .get('/api/students/dashboard')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });
  });



  describe('GET /api/students/:studentId/score', () => {
    test('owner can retrieve their readiness score', async () => {
      const res = await request(app)
        .get(`/api/students/${student1._id}/score`)
        .set('Authorization', `Bearer ${token1}`);
      expect(res.status).toBe(200);
      expect(res.body.data.score).toBeDefined();
    });
  });
});
