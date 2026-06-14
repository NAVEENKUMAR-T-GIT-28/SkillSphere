/**
 * Notifications Routes
 * GET    /api/notifications           — Get own notifications
 * PATCH  /api/notifications/:id/read  — Mark notification as read
 * PATCH  /api/notifications/read-all  — Mark all as read
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const { trackRouter } = require('../utils/routeTracker');
const router = trackRouter(express.Router(), '/api/notifications');

router.get('/', authenticate, notificationController.getNotifications);

router.patch('/:id/read', authenticate, notificationController.markOneRead);

router.patch('/read-all', authenticate, notificationController.markAllRead);

module.exports = router;
