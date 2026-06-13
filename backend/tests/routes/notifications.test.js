const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const notificationsRoutes = require('../../routes/notifications');
const { createStudent } = require('../helpers/factories');
const { errorHandler } = require('../../middleware/errorHandler');
const Notification = require('../../models/Notification');

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
app.use('/api/notifications', notificationsRoutes);
app.use(errorHandler);

describe('Notifications Routes - Comprehensive', () => {
  let studentToken, studentUser;
  let otherToken, otherUser;
  let notifId;

  beforeAll(async () => {
    const s1 = await createStudent();
    studentToken = s1.token;
    studentUser = s1.user;

    const s2 = await createStudent();
    otherToken = s2.token;
    otherUser = s2.user;

    const notif = await Notification.create({
      user_id: studentUser._id,
      title: 'Test Notification', message: 'Hello World', type: 'general', is_read: false
    });
    notifId = notif._id;
  });

  describe('GET /api/notifications', () => {
    test('Missing token (401)', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    test('Success', async () => {
      const res = await request(app).get('/api/notifications').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    test('Invalid ID (400)', async () => {
      const res = await request(app).patch('/api/notifications/bad-id/read').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(400);
    });

    test('Not owner (404)', async () => {
      const res = await request(app).patch(`/api/notifications/${notifId}/read`).set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(404);
    });

    test('Success', async () => {
      const res = await request(app).patch(`/api/notifications/${notifId}/read`).set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.is_read).toBe(true);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    beforeAll(async () => {
      await Notification.create({
        user_id: studentUser._id, title: 'Another', message: 'Hello', type: 'general', is_read: false
      });
    });

    test('Success', async () => {
      const res = await request(app).patch('/api/notifications/read-all').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBeDefined();
    });
  });
});
