/**
 * Notifications Routes
 * GET    /api/notifications           — Get own notifications
 * PATCH  /api/notifications/:id/read  — Mark notification as read
 * PATCH  /api/notifications/read-all  — Mark all as read
 */

const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const router = express.Router();

/**
 * GET /api/notifications
 * Get current user's notifications. Supports unread filter.
 */
router.get(
  '/',
  authenticate,
  async (req, res, next) => {
    try {
      const { is_read, page = 1, limit = 20 } = req.query;
      const filter = { user_id: req.user.userId };

      if (is_read !== undefined) {
        filter.is_read = is_read === 'true';
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await Notification.countDocuments(filter);
      const unread = await Notification.countDocuments({ user_id: req.user.userId, is_read: false });

      const notifications = await Notification.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      success(res, notifications, {
        total,
        unread,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
router.patch(
  '/:id/read',
  authenticate,
  async (req, res, next) => {
    try {
      const notification = await Notification.findOne({
        _id: req.params.id,
        user_id: req.user.userId
      });

      if (!notification) {
        return error(res, 'Notification not found', 404, 'NOT_FOUND');
      }

      notification.is_read = true;
      await notification.save();

      success(res, notification);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read.
 */
router.patch(
  '/read-all',
  authenticate,
  async (req, res, next) => {
    try {
      const result = await Notification.updateMany(
        { user_id: req.user.userId, is_read: false },
        { is_read: true }
      );

      success(res, { message: 'All notifications marked as read', modified: result.modifiedCount });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
