const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Generic error handler to mimic server.js
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: { message: err.message, code: err.code || 'SERVER_ERROR' }
  });
});

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    test('successfully registers a student', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student1@test.com',
          password: 'Password123!',
          base_role: 'student',
          full_name: 'John Doe',
          roll_number: 'CS101',
          department: 'CSE',
          batch_year: 2021,
          graduation_year: 2025
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('student1@test.com');
      expect(res.body.data.user.baseRole).toBe('student');
    });

    test('successfully registers a faculty', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'faculty1@test.com',
          password: 'Password123!',
          base_role: 'faculty',
          full_name: 'Dr. Smith',
          department: 'CSE',
          employee_id: 'EMP001'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    test('fails if student missing roll_number (Validation)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'student2@test.com',
          password: 'Password123!',
          base_role: 'student',
          full_name: 'John Doe',
          department: 'CSE'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('prevents registering as HOD directly', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'hod@test.com',
          password: 'Password123!',
          base_role: 'hod',
          full_name: 'Dr. Boss',
          department: 'CSE',
          employee_id: 'HOD001'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('fails on duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'dup@test.com', password: 'Password123!', base_role: 'student',
        full_name: 'Dup', roll_number: 'CS102', department: 'CSE', batch_year: 2021, graduation_year: 2025
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'dup@test.com', password: 'Password123!', base_role: 'student',
        full_name: 'Dup2', roll_number: 'CS103', department: 'CSE', batch_year: 2021, graduation_year: 2025
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'login@test.com', password: 'Password123!', base_role: 'student',
        full_name: 'Login User', roll_number: 'L100', department: 'CSE', batch_year: 2021, graduation_year: 2025
      });
    });

    test('successfully logs in with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com', password: 'Password123!'
      });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    test('fails with incorrect password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com', password: 'WrongPassword!'
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('fails with unregistered email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@test.com', password: 'Password123!'
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('fails if account is deactivated', async () => {
      await User.updateOne({ email: 'login@test.com' }, { is_active: false });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login@test.com', password: 'Password123!'
      });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('ACCOUNT_DEACTIVATED');
    });
  });
});
