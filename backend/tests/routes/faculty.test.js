const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const facultyRoutes = require('../../routes/faculty');
const { createStudent, createFaculty, createTaxonomySkill } = require('../helpers/factories');
const { errorHandler } = require('../../middleware/errorHandler');
const Skill = require('../../models/Skill');
const Project = require('../../models/Project');

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
app.use('/api/verification', facultyRoutes);
app.use(errorHandler);

describe('Faculty Routes - Comprehensive', () => {
  let facultyToken, studentToken;
  let student;
  let skillId, projectId;

  beforeAll(async () => {
    const f = await createFaculty();
    facultyToken = f.token;

    const s = await createStudent();
    studentToken = s.token;
    student = s.student;

    const tax = await createTaxonomySkill({ name: 'Java' });

    const skill = await Skill.create({
      student_id: student._id, taxonomy_id: tax._id, skill_name: 'Java',
      proficiency: 'advanced', evidence_url: 'http://test.com', status: 'pending'
    });
    skillId = skill._id;

    const project = await Project.create({
      created_by: student._id, student_ids: [student._id],
      title: 'Cool Project', tech_stack: ['Java'], complexity_tier: 'advanced', status: 'pending', github_url: 'https://github.com/test/repo'
    });
    projectId = project._id;
  });

  describe('GET /api/verification/queue', () => {
    test('Auth: Missing token', async () => {
      const res = await request(app).get('/api/verification/queue');
      expect(res.status).toBe(401);
    });

    test('Auth: Student rejected', async () => {
      const res = await request(app).get('/api/verification/queue').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('Success', async () => {
      const res = await request(app).get('/api/verification/queue').set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.skills.items.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/verification/:type/:itemId/approve', () => {
    test('Invalid type (400)', async () => {
      const res = await request(app).post(`/api/verification/invalid_type/${skillId}/approve`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_TYPE');
    });

    test('Missing item (404)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).post(`/api/verification/skill/${fakeId}/approve`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(404);
    });

    test('Success skill approve', async () => {
      const res = await request(app).post(`/api/verification/skill/${skillId}/approve`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.item.status).toBe('verified');
    });

    test('Already processed (400)', async () => {
      const res = await request(app).post(`/api/verification/skill/${skillId}/approve`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('ALREADY_PROCESSED');
    });
  });

  describe('POST /api/verification/:type/:itemId/reject', () => {
    test('Validation failure missing reason', async () => {
      const res = await request(app).post(`/api/verification/project/${projectId}/reject`).set('Authorization', `Bearer ${facultyToken}`).send({});
      expect(res.status).toBe(400);
    });

    test('Success project reject', async () => {
      const res = await request(app).post(`/api/verification/project/${projectId}/reject`).set('Authorization', `Bearer ${facultyToken}`).send({ reason: 'Not good' });
      expect(res.status).toBe(200);
      expect(res.body.data.item.status).toBe('rejected');
    });
  });
});
