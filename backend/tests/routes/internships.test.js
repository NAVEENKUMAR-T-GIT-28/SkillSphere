const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const internshipsRoutes = require('../../routes/internships');
const Internship = require('../../models/Internship');
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
app.use('/api/students', internshipsRoutes);
app.use(errorHandler);

describe('Internships Routes - Comprehensive', () => {
  let s1Token, s1;
  let s2Token, s2;
  let facultyToken;
  let internshipId;

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

  describe('POST /api/students/:studentId/internships', () => {
    test('Missing token (401)', async () => {
      const res = await request(app).post(`/api/students/${s1._id}/internships`);
      expect(res.status).toBe(401);
    });

    test('Not owner, not hod (403)', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/internships`)
        .set('Authorization', `Bearer ${s2Token}`)
        .send({ company: 'Acme Corp', role: 'SDE Intern', start_date: '2024-05-01' });
      expect(res.status).toBe(403);
    });

    test('Faculty rejected (403)', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/internships`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ company: 'Acme Corp', role: 'SDE Intern', start_date: '2024-05-01' });
      expect(res.status).toBe(403);
    });

    test('Validation failure — missing company/role/start_date', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/internships`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Validation failure — invalid start_date', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/internships`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ company: 'Acme Corp', role: 'SDE Intern', start_date: 'not-a-date' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Validation failure — negative duration', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/internships`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ company: 'Acme Corp', role: 'SDE Intern', start_date: '2024-05-01', duration_months: -2 });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Success — owner (student) creates internship', async () => {
      const res = await request(app)
        .post(`/api/students/${s1._id}/internships`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({
          company: 'Acme Corp',
          role: 'Software Engineering Intern',
          start_date: '2024-05-01',
          end_date: '2024-07-01',
          duration_months: 2,
          stipend: 15000
        });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.company).toBe('Acme Corp');
      internshipId = res.body.data._id;
    });

    test('Success — creates a verification log entry on submission', async () => {
      const logs = await VerificationLog.find({ item_type: 'internship', item_id: internshipId });
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('submitted');
    });
  });

  describe('GET /api/students/:studentId/internships', () => {
    test('Success — owner lists their internships', async () => {
      const res = await request(app)
        .get(`/api/students/${s1._id}/internships`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Success — faculty can view any student internships', async () => {
      const res = await request(app)
        .get(`/api/students/${s1._id}/internships`)
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
    });

    test('Not owner (403)', async () => {
      const res = await request(app)
        .get(`/api/students/${s1._id}/internships`)
        .set('Authorization', `Bearer ${s2Token}`);
      expect(res.status).toBe(403);
    });

    test('Filters by status', async () => {
      const res = await request(app)
        .get(`/api/students/${s1._id}/internships?status=pending`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);
      res.body.data.forEach(i => expect(i.status).toBe('pending'));
    });
  });

  describe('PATCH /api/students/:studentId/internships/:internshipId', () => {
    test('Missing internship (404)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/students/${s1._id}/internships/${fakeId}`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ role: 'Updated Role' });
      expect(res.status).toBe(404);
    });

    test('Owner can update a pending internship', async () => {
      const res = await request(app)
        .patch(`/api/students/${s1._id}/internships/${internshipId}`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ role: 'Senior SDE Intern' });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('Senior SDE Intern');
    });

    test('A rejected internship is reset to pending on edit', async () => {
      await Internship.findByIdAndUpdate(internshipId, { status: 'rejected', rejection_reason: 'Missing offer letter' });
      const res = await request(app)
        .patch(`/api/students/${s1._id}/internships/${internshipId}`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ offer_letter_url: 'https://drive.google.com/file/d/offer123' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('pending');
    });

    test('Cannot update a verified internship', async () => {
      await Internship.findByIdAndUpdate(internshipId, { status: 'verified' });
      const res = await request(app)
        .patch(`/api/students/${s1._id}/internships/${internshipId}`)
        .set('Authorization', `Bearer ${s1Token}`)
        .send({ role: 'Hacked Role' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_UPDATE_LOCKED');
    });
  });

  describe('DELETE /api/students/:studentId/internships/:internshipId', () => {
    test('Faculty rejected (403)', async () => {
      const res = await request(app)
        .delete(`/api/students/${s1._id}/internships/${internshipId}`)
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });

    test('Cannot delete a verified internship', async () => {
      const res = await request(app)
        .delete(`/api/students/${s1._id}/internships/${internshipId}`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_DELETE_VERIFIED');
    });

    test('Missing internship (404)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/students/${s1._id}/internships/${fakeId}`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(404);
    });

    test('Success — owner deletes a pending internship', async () => {
      await Internship.findByIdAndUpdate(internshipId, { status: 'pending' });
      const res = await request(app)
        .delete(`/api/students/${s1._id}/internships/${internshipId}`)
        .set('Authorization', `Bearer ${s1Token}`);
      expect(res.status).toBe(200);

      const stillExists = await Internship.findById(internshipId);
      expect(stillExists).toBeNull();
    });
  });
});
