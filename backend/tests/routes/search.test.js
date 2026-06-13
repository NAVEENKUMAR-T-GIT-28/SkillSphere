const request = require('supertest');
const express = require('express');
const searchRoutes = require('../../routes/search');
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
app.use('/api/search', searchRoutes);
app.use(errorHandler);

describe('Search Routes - Comprehensive', () => {
  let facultyToken, studentToken;

  beforeAll(async () => {
    const f = await createFaculty();
    facultyToken = f.token;

    const s = await createStudent({ full_name: 'Searchable Student', department: 'IT', cgpa: 9.5, batch_year: 2025, section: 'A', readiness_tier: 'placement_ready' });
    studentToken = s.token;
  });

  describe('GET /api/search/students', () => {
    test('Missing token (401)', async () => {
      const res = await request(app).get('/api/search/students');
      expect(res.status).toBe(401);
    });

    test('Student rejected (403)', async () => {
      const res = await request(app).get('/api/search/students').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('Success basic search', async () => {
      const res = await request(app).get('/api/search/students?name=Searchable').set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('Success multi-filter search', async () => {
      const res = await request(app)
        .get('/api/search/students?cgpa_min=9.0&cgpa_max=10.0&department=IT&section=A,B&batch_year=2025&tier=placement_ready,developing')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
    
    test('Empty result', async () => {
      const res = await request(app).get('/api/search/students?name=NobodyExists').set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });
});
