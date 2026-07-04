const request = require('supertest');
const express = require('express');
const searchV2Routes = require('../../routes/searchV2');
const { createStudent, createFaculty, createStudentSearchDoc } = require('../helpers/factories');
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
app.use('/api/search/v2', searchV2Routes);
app.use(errorHandler);

describe('Search V2 Routes (StudentSearch denormalized cache)', () => {
  let facultyToken, studentToken;

  beforeAll(async () => {
    const f = await createFaculty();
    facultyToken = f.token;

    const s1 = await createStudent({ full_name: 'Ada Lovelace' });
    studentToken = s1.token;
    await createStudentSearchDoc(s1.student._id, {
      name: 'Ada Lovelace',
      cgpa: 9.2,
      department: 'IT',
      section: 'A',
      batch_year: 2025,
      readiness_tier: 'placement_ready',
      readiness_score: 92,
      verified_skills: ['JavaScript', 'React']
    });

    const s2 = await createStudent({ full_name: 'Grace Hopper' });
    await createStudentSearchDoc(s2.student._id, {
      name: 'Grace Hopper',
      cgpa: 7.1,
      department: 'CSE',
      section: 'B',
      batch_year: 2024,
      readiness_tier: 'developing',
      readiness_score: 55,
      verified_skills: ['Python']
    });
  });

  describe('GET /api/search/v2/students', () => {
    test('Missing token (401)', async () => {
      const res = await request(app).get('/api/search/v2/students');
      expect(res.status).toBe(401);
    });

    test('Student rejected (403)', async () => {
      const res = await request(app).get('/api/search/v2/students').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    test('Faculty can search with no filters', async () => {
      const res = await request(app).get('/api/search/v2/students').set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
    });

    test('Filters by cgpa range', async () => {
      const res = await request(app)
        .get('/api/search/v2/students?cgpa_min=9.0&cgpa_max=10.0')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      res.body.data.forEach(s => {
        expect(s.cgpa).toBeGreaterThanOrEqual(9.0);
        expect(s.cgpa).toBeLessThanOrEqual(10.0);
      });
      expect(res.body.data.some(s => s.name === 'Ada Lovelace')).toBe(true);
    });

    test('Filters by department', async () => {
      const res = await request(app)
        .get('/api/search/v2/students?department=IT')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      res.body.data.forEach(s => expect(s.department).toBe('IT'));
    });

    test('Filters by comma-separated sections', async () => {
      const res = await request(app)
        .get('/api/search/v2/students?section=A,B')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    test('Filters by readiness tier', async () => {
      const res = await request(app)
        .get('/api/search/v2/students?tier=placement_ready')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      res.body.data.forEach(s => expect(s.readiness_tier).toBe('placement_ready'));
    });

    test('Filters by partial, case-insensitive name', async () => {
      const res = await request(app)
        .get('/api/search/v2/students?name=ada')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach(s => expect(s.name.toLowerCase()).toContain('ada'));
    });

    test('Filters by verified skills — requires ALL listed skills', async () => {
      const res = await request(app)
        .get('/api/search/v2/students?skills=JavaScript,React')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      res.body.data.forEach(s => {
        expect(s.verified_skills).toEqual(expect.arrayContaining(['JavaScript', 'React']));
      });
    });

    test('Sorts by readiness_score descending by default', async () => {
      const res = await request(app)
        .get('/api/search/v2/students')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      const scores = res.body.data.map(s => s.readiness_score);
      const sorted = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sorted);
    });

    test('Supports pagination', async () => {
      const res = await request(app)
        .get('/api/search/v2/students?page=1&limit=1')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(1);
      expect(res.body.meta.pages).toBeGreaterThanOrEqual(2);
    });

    test('Empty result for a name that does not exist', async () => {
      const res = await request(app)
        .get('/api/search/v2/students?name=NobodyExistsAtAll')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });
});
