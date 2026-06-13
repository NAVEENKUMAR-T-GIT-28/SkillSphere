const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const projectsRoutes = require('../../routes/projects');
const Project = require('../../models/Project');
const { createStudent, createFaculty } = require('../helpers/factories');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (req.headers.authorization) {
    req.user = JSON.parse(Buffer.from(req.headers.authorization.split('.')[1], 'base64').toString());
  }
  next();
});
app.use('/api', projectsRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ success: false, error: { message: err.message, code: err.code } });
});

describe('Projects Routes', () => {
  let student, token;
  let facultyToken;
  let projectId;

  beforeAll(async () => {
    const s = await createStudent();
    student = s.student;
    token = s.token;

    const f = await createFaculty();
    facultyToken = f.token;
  });

  describe('POST /api/students/:studentId/projects', () => {
    test('successfully adds a project', async () => {
      const res = await request(app)
        .post(`/api/students/${student._id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Cool App',
          tech_stack: ['Node', 'React'],
          github_url: 'https://github.com/user/repo',
          complexity_tier: 'intermediate'
        });
      expect(res.status).toBe(201);
      projectId = res.body.data._id;
    });

    test('fails with invalid github url', async () => {
      const res = await request(app)
        .post(`/api/students/${student._id}/projects`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Bad App',
          tech_stack: ['Node'],
          github_url: 'not_a_url',
          complexity_tier: 'basic'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/students/:studentId/projects', () => {
    test('fetches projects', async () => {
      const res = await request(app)
        .get(`/api/students/${student._id}/projects`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/students/:studentId/projects/:projectId', () => {
    test('updates project correctly', async () => {
      const res = await request(app)
        .patch(`/api/students/${student._id}/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Very Cool App' });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Very Cool App');
    });
  });

  describe('POST /api/projects/:projectId/rate', () => {
    test('student cannot rate project', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          functionality: 4, code_quality: 4, documentation: 3, innovation: 4, complexity: 4
        });
      expect(res.status).toBe(403);
    });

    test('faculty can rate project', async () => {
      const res = await request(app)
        .post(`/api/projects/${projectId}/rate`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          functionality: 5, code_quality: 5, documentation: 5, innovation: 4, complexity: 5
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('reviewed');
      expect(res.body.data.faculty_rating.average).toBe(4.8);
    });

    test('cannot edit reviewed project', async () => {
      const res = await request(app)
        .patch(`/api/students/${student._id}/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Blocked Edit' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_EDIT_REVIEWED');
    });
  });
});
