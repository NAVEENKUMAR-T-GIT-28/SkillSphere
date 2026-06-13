const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const codingProfilesRoutes = require('../../routes/codingProfiles');
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
app.use('/api/students', codingProfilesRoutes);
app.use(errorHandler);

describe('Coding Profiles Routes - Comprehensive', () => {
  let s1Token, s1;
  let s2Token;
  let facultyToken;
  let profileId;

  beforeAll(async () => {
    const st1 = await createStudent();
    s1Token = st1.token;
    s1 = st1.student;

    const st2 = await createStudent();
    s2Token = st2.token;

    const f = await createFaculty();
    facultyToken = f.token;
  });

  describe('POST /api/students/:studentId/coding-profiles', () => {
    test('Missing token (401)', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/coding-profiles`);
      expect(res.status).toBe(401);
    });

    test('Not owner (403)', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/coding-profiles`).set('Authorization', `Bearer ${s2Token}`);
      expect(res.status).toBe(403);
    });

    test('Validation failure', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/coding-profiles`).set('Authorization', `Bearer ${s1Token}`).send({
        platform: 'invalid_platform', username: 'test', profile_url: 'not_a_url'
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Success owner creates', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/coding-profiles`).set('Authorization', `Bearer ${s1Token}`).send({
        platform: 'leetcode', username: 'testcoder', profile_url: 'https://leetcode.com/testcoder'
      });
      expect(res.status).toBe(201);
      profileId = res.body.data._id;
    });

    test('Duplicate platform (409)', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/coding-profiles`).set('Authorization', `Bearer ${s1Token}`).send({
        platform: 'leetcode', username: 'testcoder2', profile_url: 'https://leetcode.com/testcoder2'
      });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_PLATFORM');
    });
  });

  describe('GET /api/students/:studentId/coding-profiles', () => {
    test('Success owner', async () => {
      const res = await request(app).get(`/api/students/${s1._id}/coding-profiles`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Success faculty', async () => {
      const res = await request(app).get(`/api/students/${s1._id}/coding-profiles`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/students/:studentId/coding-profiles/:profileId', () => {
    test('Missing ID (404)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).patch(`/api/students/${s1._id}/coding-profiles/${fakeId}`).set('Authorization', `Bearer ${s1Token}`).send({
        problems_solved: 100
      });
      expect(res.status).toBe(404);
    });

    test('Success owner updates', async () => {
      const res = await request(app).patch(`/api/students/${s1._id}/coding-profiles/${profileId}`).set('Authorization', `Bearer ${s1Token}`).send({
        problems_solved: 50
      });
      expect(res.status).toBe(200);
      expect(res.body.data.problems_solved).toBe(50);
    });
  });

  describe('DELETE /api/students/:studentId/coding-profiles/:profileId', () => {
    test('Faculty rejected (403)', async () => {
      const res = await request(app).delete(`/api/students/${s1._id}/coding-profiles/${profileId}`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });

    test('Success owner deletes', async () => {
      const res = await request(app).delete(`/api/students/${s1._id}/coding-profiles/${profileId}`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
    });
  });
});
