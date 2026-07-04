const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const achievementsRoutes = require('../../routes/achievements');
const Achievement = require('../../models/Achievement');
const VerificationLog = require('../../models/VerificationLog');
const { createStudent, createFaculty } = require('../helpers/factories');
const { errorHandler } = require('../../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  try {
    req.user = JSON.parse(Buffer.from(authHeader.split(' ')[1], 'base64').toString());
  } catch (e) {}
  next();
});
app.use('/api/students', achievementsRoutes);
app.use(errorHandler);

describe('Achievements Routes - Comprehensive', () => {
  let s1Token, s1;
  let s2Token, s2;
  let facultyToken, hodToken;
  let achievementId;

  beforeAll(async () => {
    const st1 = await createStudent();
    s1Token = st1.token;
    s1 = st1.student;

    const st2 = await createStudent();
    s2Token = st2.token;
    s2 = st2.student;

    const f = await createFaculty();
    facultyToken = f.token;

    const { generateToken } = require('../helpers/tokenHelper');
    hodToken = generateToken(new mongoose.Types.ObjectId(), 'hod');
  });

  describe('POST /api/students/:studentId/achievements', () => {
    test('Missing token (401)', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/achievements`);
      expect(res.status).toBe(401);
    });

    test('Not owner, not hod (403)', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/achievements`)
        .set('Authorization', `Bearer ${s2Token}`)
        .send({ title: 'Hack the Planet', category: 'hackathon' });
      expect(res.status).toBe(403);
    });

    test('Faculty rejected (403)', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/achievements`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ title: 'Hack the Planet', category: 'hackathon' });
      expect(res.status).toBe(403);
    });

    test('Validation failure — missing title', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/achievements`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ category: 'hackathon' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Validation failure — invalid category', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/achievements`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ title: 'Robotics Award', category: 'not_a_real_category' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Success — owner (student) creates achievement', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/achievements`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({
          title: 'Smart India Hackathon Winner',
          category: 'hackathon',
          description: 'Won first place nationally',
          certificate_url: 'https://drive.google.com/file/d/cert123'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.title).toBe('Smart India Hackathon Winner');
      achievementId = res.body.data._id;
    });

    test('Success — creates a verification log entry on submission', async () => {
      const logs = await VerificationLog.find({ item_type: 'achievement', item_id: achievementId });
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('submitted');
    });
  });

  describe('GET /api/students/:studentId/achievements', () => {
    test('Success — owner lists their achievements', async () => {
      const res = await request(app)
        .get(`/api/students/${s1._id}/achievements`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Success — faculty can view any student achievements', async () => {
      const res = await request(app)
        .get(`/api/students/${s1._id}/achievements`)
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
    });

    test('Not owner (403)', async () => {
      const res = await request(app)
        .get(`/api/students/${s1._id}/achievements`)
        .set('Authorization', `Bearer ${s2Token}`);
      expect(res.status).toBe(403);
    });

    test('Filters by category', async () => {
      const res = await request(app)
        .get(`/api/students/${s1._id}/achievements?category=hackathon`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
      res.body.data.forEach(a => expect(a.category).toBe('hackathon'));
    });

    test('Filters by status', async () => {
      const res = await request(app)
        .get(`/api/students/${s1._id}/achievements?status=pending`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
      res.body.data.forEach(a => expect(a.status).toBe('pending'));
    });
  });

  describe('PATCH /api/students/:studentId/achievements/:achievementId', () => {
    test('Missing achievement (404)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/students/${s1._id}/achievements/${fakeId}`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ title: 'Updated' });
      expect(res.status).toBe(404);
    });

    test('Owner can update a pending achievement', async () => {
      const res = await request(app)
        .patch(`/api/students/${s1._id}/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ title: 'Smart India Hackathon 2024 Winner' });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Smart India Hackathon 2024 Winner');
    });

    test('A rejected achievement is reset to pending on edit', async () => {
      await Achievement.findByIdAndUpdate(achievementId, { status: 'rejected', rejection_reason: 'Needs proof' });
      const res = await request(app)
        .patch(`/api/students/${s1._id}/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ description: 'Added proof link in certificate_url' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending');
    });

    test('Cannot update a verified achievement', async () => {
      await Achievement.findByIdAndUpdate(achievementId, { status: 'verified' });
      const res = await request(app)
        .patch(`/api/students/${s1._id}/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ title: 'Hacked Title' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_UPDATE_LOCKED');
    });
  });

  describe('DELETE /api/students/:studentId/achievements/:achievementId', () => {
    test('Faculty rejected (403)', async () => {
      const res = await request(app)
        .delete(`/api/students/${s1._id}/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });

    test('Cannot delete a verified achievement', async () => {
      const res = await request(app)
        .delete(`/api/students/${s1._id}/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_DELETE_VERIFIED');
    });

    test('Missing achievement (404)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/students/${s1._id}/achievements/${fakeId}`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(404);
    });

    test('Success — owner deletes a pending achievement', async () => {
      await Achievement.findByIdAndUpdate(achievementId, { status: 'pending' });
      const res = await request(app)
        .delete(`/api/students/${s1._id}/achievements/${achievementId}`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);

      const stillExists = await Achievement.findById(achievementId);
      expect(stillExists).toBeNull();
    });
  });
});
