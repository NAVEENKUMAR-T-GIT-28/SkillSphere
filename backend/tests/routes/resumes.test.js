const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const resumesRoutes = require('../../routes/resumes');
const { createStudent, createFaculty } = require('../helpers/factories');
const { errorHandler } = require('../../middleware/errorHandler');

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
app.use('/api/students', resumesRoutes);
app.use(errorHandler);

describe('Resumes Routes - Comprehensive', () => {
  let s1Token, s1;
  let s2Token, s2;
  let facultyToken;
  let resumeId;

  beforeAll(async () => {
    const st1 = await createStudent();
    s1Token = st1.token;
    s1 = st1.student;

    const st2 = await createStudent();
    s2Token = st2.token;
    s2 = st2.student;

    const f = await createFaculty();
    facultyToken = f.token;
  });

  describe('POST /api/students/:studentId/resumes', () => {
    test('Missing token (401)', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/resumes`);
      expect(res.status).toBe(401);
    });

    test('Not owner (403)', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/resumes`).set('Authorization', `Bearer ${s2Token}`).send({
        drive_link: 'https://drive.google.com/file/d/test1234'
      });
      expect(res.status).toBe(403);
    });

    test('Faculty rejected (403)', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/resumes`).set('Authorization', `Bearer ${facultyToken}`).send({
        drive_link: 'https://drive.google.com/file/d/test1234'
      });
      expect(res.status).toBe(403);
    });

    test('Validation failure', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/resumes`).set('Authorization', `Bearer ${s1Token}`).send({
        drive_link: 'bad_link'
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Success owner creates', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/resumes`).set('Authorization', `Bearer ${s1Token}`).send({
        drive_link: 'https://drive.google.com/file/d/test1234', label: 'v1'
      });
      expect(res.status).toBe(201);
      resumeId = res.body.data._id;
    });
  });

  describe('GET /api/students/:studentId/resumes', () => {
    test('Success owner', async () => {
      const res = await request(app).get(`/api/students/${s1._id}/resumes`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Success faculty', async () => {
      const res = await request(app).get(`/api/students/${s1._id}/resumes`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/students/:studentId/resumes/:resumeId', () => {
    test('Faculty rejected (403)', async () => {
      const res = await request(app).delete(`/api/students/${s1._id}/resumes/${resumeId}`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });

    test('Missing ID (404)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/students/${s1._id}/resumes/${fakeId}`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(404);
    });

    test('Success owner deletes', async () => {
      const res = await request(app).delete(`/api/students/${s1._id}/resumes/${resumeId}`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
    });
  });
});
