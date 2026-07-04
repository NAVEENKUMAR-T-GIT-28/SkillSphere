const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const skillsRoutes = require('../../routes/skills');
const { createStudent, createTaxonomySkill, createFaculty } = require('../helpers/factories');

const app = express();
app.use(express.json());
// Mock auth middleware for route decoding (using real JWT logic locally if we can, but supertest raw req needs it parsed)
app.use((req, res, next) => {
  if (req.headers.authorization) {
    req.user = JSON.parse(Buffer.from(req.headers.authorization.split('.')[1], 'base64').toString());
  }
  next();
});
app.use('/api', skillsRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ success: false, error: { message: err.message, code: err.code } });
});

describe('Skills Routes', () => {
  let student, token;
  let facultyToken;
  let taxonomySkill;

  beforeAll(async () => {
    const s = await createStudent();
    student = s.student;
    token = s.token;

    const f = await createFaculty();
    facultyToken = f.token;

    taxonomySkill = await createTaxonomySkill({ name: 'Node.js', category: 'programming' });
  });

  describe('GET /api/skill-taxonomy', () => {
    test('public access returns taxonomy skills', async () => {
      const res = await request(app).get('/api/skill-taxonomy');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(s => s.name === 'Node.js')).toBe(true);
    });
  });

  describe('POST /api/students/:studentId/skills', () => {
    test('student adds skill successfully', async () => {
      const res = await request(app)
        .post(`/api/students/${student._id}/skills`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          taxonomy_id: taxonomySkill._id,
          proficiency: 'beginner'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.skill_name).toBe('Node.js');
    });

    test('fails when adding duplicate skill', async () => {
      const res = await request(app)
        .post(`/api/students/${student._id}/skills`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          taxonomy_id: taxonomySkill._id,
          proficiency: 'intermediate'
        });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_SKILL');
    });

    test('fails when evidence is missing for advanced proficiency', async () => {
      const tax2 = await createTaxonomySkill({ name: 'React' });
      const res = await request(app)
        .post(`/api/students/${student._id}/skills`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          taxonomy_id: tax2._id,
          proficiency: 'advanced'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('EVIDENCE_REQUIRED');
    });

    test('accepts and stores years_experience', async () => {
      const tax3 = await createTaxonomySkill({ name: 'Go' });
      const res = await request(app)
        .post(`/api/students/${student._id}/skills`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          taxonomy_id: tax3._id,
          proficiency: 'intermediate',
          years_experience: 2.5
        });
      expect(res.status).toBe(201);
      expect(res.body.data.years_experience).toBe(2.5);
    });

    test('rejects years_experience above the allowed max', async () => {
      const tax4 = await createTaxonomySkill({ name: 'Rust' });
      const res = await request(app)
        .post(`/api/students/${student._id}/skills`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          taxonomy_id: tax4._id,
          proficiency: 'intermediate',
          years_experience: 500
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/students/:studentId/skills', () => {
    test('fetches student skills', async () => {
      const res = await request(app)
        .get(`/api/students/${student._id}/skills`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/students/:studentId/skills/:skillId', () => {
    let skillToDelete;
    beforeAll(async () => {
      const tax = await createTaxonomySkill({ name: 'Python' });
      const res = await request(app)
        .post(`/api/students/${student._id}/skills`)
        .set('Authorization', `Bearer ${token}`)
        .send({ taxonomy_id: tax._id, proficiency: 'beginner' });
      skillToDelete = res.body.data;
    });

    test('faculty CANNOT delete student skill', async () => {
      const res = await request(app)
        .delete(`/api/students/${student._id}/skills/${skillToDelete._id}`)
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });

    test('owner can delete their pending skill', async () => {
      const res = await request(app)
        .delete(`/api/students/${student._id}/skills/${skillToDelete._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});
