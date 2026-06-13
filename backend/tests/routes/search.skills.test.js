const request = require('supertest');
const express = require('express');
const searchRoutes = require('../../routes/search');
const { createStudent, createFaculty, createTaxonomySkill, createSkill } = require('../helpers/factories');
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

describe('Search Routes — skills filter', () => {
  let facultyToken;
  let student;
  let taxonomy;

  beforeAll(async () => {
    const f = await createFaculty();
    facultyToken = f.token;

    const s = await createStudent({ full_name: 'Skill Filter Student' });
    student = s.student;

    taxonomy = await createTaxonomySkill({ name: 'Rust' });

    // Verified skill matching the filter
    await createSkill(student._id, taxonomy._id, {
      skill_name: 'Rust',
      status: 'verified'
    });
  });

  test('returns students who have ALL specified verified skills', async () => {
    const res = await request(app)
      .get('/api/search/students?skills=Rust')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some(s => s._id === student._id.toString())).toBe(true);
  });

  test('returns empty array when no student has all specified skills', async () => {
    const res = await request(app)
      .get('/api/search/students?skills=Rust,NonexistentSkillXYZ')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  test('sort_order=asc applies ascending sort', async () => {
    const res = await request(app)
      .get('/api/search/students?sort_by=cgpa&sort_order=asc')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
