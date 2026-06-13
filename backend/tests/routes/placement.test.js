const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const placementRoutes = require('../../routes/placement');
const { createStudent, createFaculty, createUser } = require('../helpers/factories');
const PlacementDrive = require('../../models/PlacementDrive');
const Application = require('../../models/Application');

const app = express();
app.use(express.json());
// Global error handler mock to match server.js
const { errorHandler } = require('../../middleware/errorHandler');
// Mock auth middleware logic manually since we are not using the full server.js
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = undefined;
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    if (token === 'invalid-token') throw new Error('Invalid');
    req.user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch(e) {}
  next();
});
app.use('/api', placementRoutes);
app.use(errorHandler);

describe('Placement Routes - Comprehensive', () => {
  let hodToken, facultyToken, s1Token, s2Token;
  let hod, faculty, s1, s2;
  let driveId, closedDriveId, pastDeadlineDriveId;
  let applicationId;

  beforeAll(async () => {
    hod = await createUser({ base_role: 'hod' });
    hodToken = require('../helpers/tokenHelper').generateToken(hod._id, 'hod');

    const f = await createFaculty();
    facultyToken = f.token;
    faculty = f.user;

    const st1 = await createStudent({ cgpa: 9.0, batch_year: 2025 });
    s1Token = st1.token;
    s1 = st1.student;

    const st2 = await createStudent({ cgpa: 6.0, batch_year: 2024 });
    s2Token = st2.token;
    s2 = st2.student;
  });

  describe('POST /api/placement-drives', () => {
    test('Auth: Missing token', async () => {
      const res = await request(app).post('/api/placement-drives');
      expect(res.status).toBe(401);
    });

    test('Auth: Invalid token', async () => {
      const res = await request(app).post('/api/placement-drives').set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    test('Auth: Student rejected', async () => {
      const res = await request(app).post('/api/placement-drives').set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(403);
    });

    test('Validation: Missing fields', async () => {
      const res = await request(app).post('/api/placement-drives').set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Success: HOD creates drive', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          company_name: 'Tech Corp', role_title: 'Software Engineer',
          drive_date: new Date(Date.now() + 86400000).toISOString(),
          application_deadline: new Date(Date.now() + 43200000).toISOString(),
          drive_type: 'oncampus',
          eligibility: { min_cgpa: 8.0, batch_years: [2025] }
        });
      expect(res.status).toBe(201);
      driveId = res.body.data._id;
    });

    test('Setup closed and past deadline drives', async () => {
      let res = await request(app).post('/api/placement-drives').set('Authorization', `Bearer ${hodToken}`).send({
        company_name: 'Past Corp', role_title: 'Dev', drive_date: new Date().toISOString(),
        application_deadline: new Date(Date.now() - 43200000).toISOString(), drive_type: 'oncampus'
      });
      pastDeadlineDriveId = res.body.data._id;

      let closedDrive = await PlacementDrive.create({
        company_name: 'Closed Corp', role_title: 'Dev', drive_date: new Date().toISOString(),
        application_deadline: new Date(Date.now() + 43200000).toISOString(), drive_type: 'oncampus', status: 'closed', created_by: hod._id
      });
      closedDriveId = closedDrive._id;
    });
  });

  describe('GET /api/placement-drives', () => {
    test('Success listing', async () => {
      const res = await request(app).get('/api/placement-drives').set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/placement-drives/:id', () => {
    test('Missing resource (404)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/placement-drives/${fakeId}`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(404);
    });

    test('Invalid ObjectId (400)', async () => {
      const res = await request(app).get(`/api/placement-drives/bad-id`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(400);
    });

    test('Success details', async () => {
      const res = await request(app).get(`/api/placement-drives/${driveId}`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.drive).toBeDefined();
    });
  });

  describe('POST /api/placement-drives/:id/apply', () => {
    test('Auth: Faculty rejected', async () => {
      const res = await request(app).post(`/api/placement-drives/${driveId}/apply`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });

    test('Business: Past deadline', async () => {
      const res = await request(app).post(`/api/placement-drives/${pastDeadlineDriveId}/apply`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DEADLINE_PASSED');
    });

    test('Business: Drive closed', async () => {
      const res = await request(app).post(`/api/placement-drives/${closedDriveId}/apply`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('DRIVE_CLOSED');
    });

    test('Business: Not eligible', async () => {
      const res = await request(app).post(`/api/placement-drives/${driveId}/apply`).set('Authorization', `Bearer ${s2Token}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('NOT_ELIGIBLE');
    });

    test('Success application', async () => {
      const res = await request(app).post(`/api/placement-drives/${driveId}/apply`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(201);
      applicationId = res.body.data._id;
    });

    test('Business: Duplicate application', async () => {
      const res = await request(app).post(`/api/placement-drives/${driveId}/apply`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/placement-drives/:id/shortlist', () => {
    test('Auth: Student rejected', async () => {
      const res = await request(app).get(`/api/placement-drives/${driveId}/shortlist`).set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(403);
    });

    test('Success HOD', async () => {
      const res = await request(app).get(`/api/placement-drives/${driveId}/shortlist`).set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('PATCH /api/applications/:id/status', () => {
    test('Auth: Student rejected', async () => {
      const res = await request(app).patch(`/api/applications/${applicationId}/status`).set('Authorization', `Bearer ${s1Token}`).send({ status: 'shortlisted' });
      expect(res.status).toBe(403);
    });

    test('Validation failure', async () => {
      const res = await request(app).patch(`/api/applications/${applicationId}/status`).set('Authorization', `Bearer ${facultyToken}`).send({ status: 'invalid_status' });
      expect(res.status).toBe(400);
    });

    test('Success Faculty', async () => {
      const res = await request(app).patch(`/api/applications/${applicationId}/status`).set('Authorization', `Bearer ${facultyToken}`).send({ status: 'shortlisted' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('shortlisted');
    });
  });

  describe('DELETE /api/placement-drives/:id', () => {
    test('Auth: Faculty rejected', async () => {
      const res = await request(app).delete(`/api/placement-drives/${driveId}`).set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });

    test('Success HOD', async () => {
      const res = await request(app).delete(`/api/placement-drives/${driveId}`).set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(200);
    });
  });
});
