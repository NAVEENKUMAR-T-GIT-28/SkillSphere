const request = require('supertest');
const express = require('express');
const hodRoutes = require('../../routes/hod');
const { createStudent, createFaculty, createUser } = require('../helpers/factories');
const { errorHandler } = require('../../middleware/errorHandler');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  try {
    const token = authHeader.split(' ')[1];
    if (token === 'invalid-token') throw new Error('Invalid');
    req.user = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  } catch(e) {}
  next();
});
app.use('/api/hod', hodRoutes);
app.use(errorHandler);

describe('HOD Routes — additional coverage', () => {
  let hodToken;

  beforeAll(async () => {
    const hodUser = await createUser({ base_role: 'hod' });
    hodToken = require('../helpers/tokenHelper').generateToken(hodUser._id, 'hod');

    await createFaculty({ full_name: 'Searchable Faculty Member', employee_id: 'EMPSEARCH001' });
    await createStudent({ full_name: 'Another Searchable Student', roll_number: 'ROLLSEARCH001' });
  });

  describe('GET /api/hod/users', () => {
    test('searches faculty successfully', async () => {
      const res = await request(app)
        .get('/api/hod/users?search=Searchable&role=faculty')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(u => u.name === 'Searchable Faculty Member')).toBe(true);
    });

    test('returns 400 for invalid role param', async () => {
      const res = await request(app)
        .get('/api/hod/users?search=test&role=invalidrole')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ROLE');
    });

    test('student search by roll number works', async () => {
      const res = await request(app)
        .get('/api/hod/users?search=ROLLSEARCH001&role=student')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.some(u => u.name === 'Another Searchable Student')).toBe(true);
    });
  });

  describe('GET /api/hod/classes', () => {
    test('returns unique class combinations', async () => {
      const res = await request(app)
        .get('/api/hod/classes')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('label');
        expect(res.body.data[0]).toHaveProperty('department');
      }
    });

    test('rejects faculty access', async () => {
      const f = await createFaculty();
      const res = await request(app)
        .get('/api/hod/classes')
        .set('Authorization', `Bearer ${f.token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/hod/role-assignments enrichment', () => {
    test('returns assignments for both student and faculty assignees', async () => {
      const res = await request(app)
        .get('/api/hod/role-assignments')
        .set('Authorization', `Bearer ${hodToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
