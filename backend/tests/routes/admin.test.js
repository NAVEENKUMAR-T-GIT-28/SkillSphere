const request = require('supertest');
const express = require('express');
const adminRoutes = require('../../routes/admin');
const { createStudent, createFaculty, createUser } = require('../helpers/factories');
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
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

describe('Admin Routes - Comprehensive', () => {
  let adminToken;
  let hodToken;
  let facultyToken;
  let studentToken;

  beforeAll(async () => {
    const adminUser = await createUser({ base_role: 'admin', email: 'admin@test.com' });
    adminToken = require('../helpers/tokenHelper').generateToken(adminUser._id, 'admin');

    const hodUser = await createUser({ base_role: 'hod' });
    hodToken = require('../helpers/tokenHelper').generateToken(hodUser._id, 'hod');

    const f = await createFaculty();
    facultyToken = f.token;

    const s = await createStudent();
    studentToken = s.token;
  });

  describe('POST /api/admin/create-hod', () => {
    test('Missing token (401)', async () => {
      const res = await request(app).post('/api/admin/create-hod');
      expect(res.status).toBe(401);
    });

    test('Student rejected (403)', async () => {
      const res = await request(app).post('/api/admin/create-hod').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('Faculty rejected (403)', async () => {
      const res = await request(app).post('/api/admin/create-hod').set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
    });

    test('HOD rejected (403)', async () => {
      const res = await request(app).post('/api/admin/create-hod').set('Authorization', `Bearer ${hodToken}`);
      expect(res.status).toBe(403);
    });

    test('Validation failure', async () => {
      const res = await request(app).post('/api/admin/create-hod').set('Authorization', `Bearer ${adminToken}`).send({
        email: 'invalid', password: 'short'
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Success Admin creates HOD', async () => {
      const res = await request(app).post('/api/admin/create-hod').set('Authorization', `Bearer ${adminToken}`).send({
        email: 'newhod@test.com', password: 'Password123!', full_name: 'Dr. New HOD', department: 'IT', employee_id: 'HOD002'
      });
      expect(res.status).toBe(201);
      expect(res.body.data.userId).toBeDefined();
    });

    test('Duplicate email (409)', async () => {
      const res = await request(app).post('/api/admin/create-hod').set('Authorization', `Bearer ${adminToken}`).send({
        email: 'newhod@test.com', password: 'Password123!', full_name: 'Dr. New HOD', department: 'IT', employee_id: 'HOD003'
      });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });
  });
});
