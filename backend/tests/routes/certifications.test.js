const request = require('supertest');
const express = require('express');
const certificationsRoutes = require('../../routes/certifications');
const Certification = require('../../models/Certification');
const { createStudent, createFaculty } = require('../helpers/factories');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (req.headers.authorization) {
    req.user = JSON.parse(Buffer.from(req.headers.authorization.split('.')[1], 'base64').toString());
  }
  next();
});
app.use('/api/students', certificationsRoutes);
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ success: false, error: { message: err.message, code: err.code } });
});

describe('Certifications Routes', () => {
  let student, token;
  let certId;

  beforeAll(async () => {
    const s = await createStudent();
    student = s.student;
    token = s.token;
  });

  describe('POST /api/students/:studentId/certifications', () => {
    test('successfully adds a certification', async () => {
      const res = await request(app)
        .post(`/api/students/${student._id}/certifications`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'AWS Architect',
          issuer: 'Amazon',
          category: 'technical',
          issue_date: '2023-01-01',
          drive_link: 'https://drive.google.com/file/d/test1234'
        });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('AWS Architect');
      certId = res.body.data._id;
    });

    test('fails with invalid drive link', async () => {
      const res = await request(app)
        .post(`/api/students/${student._id}/certifications`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Bad Link',
          issuer: 'Google',
          category: 'technical',
          issue_date: '2023-01-01',
          drive_link: 'https://dropbox.com/abc'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/students/:studentId/certifications/:certId', () => {
    test('owner can update pending certification', async () => {
      const res = await request(app)
        .patch(`/api/students/${student._id}/certifications/${certId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'AWS Cloud Architect' });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('AWS Cloud Architect');
    });

    test('fails to update if verified', async () => {
      await Certification.findByIdAndUpdate(certId, { status: 'verified' });
      const res = await request(app)
        .patch(`/api/students/${student._id}/certifications/${certId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Hacked Title' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_UPDATE_LOCKED');
    });
  });

  describe('DELETE /api/students/:studentId/certifications/:certId', () => {
    test('fails to delete if verified', async () => {
      const res = await request(app)
        .delete(`/api/students/${student._id}/certifications/${certId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('CANNOT_DELETE_VERIFIED');
    });
  });

  describe('GET /api/students/:studentId/certifications — filters', () => {
    beforeAll(async () => {
      // Reset the cert created earlier back to pending for filter tests
      await Certification.findByIdAndUpdate(certId, { status: 'pending' });
    });

    test('filters by status query param', async () => {
      const res = await request(app)
        .get(`/api/students/${student._id}/certifications?status=pending`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach(c => expect(c.status).toBe('pending'));
    });

    test('filters by category query param', async () => {
      const res = await request(app)
        .get(`/api/students/${student._id}/certifications?category=technical`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      res.body.data.forEach(c => expect(c.category).toBe('technical'));
    });

    test('filters by both status and category', async () => {
      const res = await request(app)
        .get(`/api/students/${student._id}/certifications?status=pending&category=technical`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
