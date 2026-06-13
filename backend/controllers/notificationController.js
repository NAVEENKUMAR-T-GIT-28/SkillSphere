// controllers/notificationController.js
const notificationRepo = require('../repositories/notificationRepo');
const { success, error } = require('../utils/response');

exports.getNotifications = async (req, res, next) => {
  try {
    const { is_read, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (is_read !== undefined) filter.is_read = is_read === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await notificationRepo.countDocuments({ user_id: req.user.userId, ...filter });
    const unread = await notificationRepo.countDocuments({ user_id: req.user.userId, is_read: false });

    const notifications = await notificationRepo.findByUserId(req.user.userId, filter, skip, parseInt(limit));

    success(res, notifications, {
      total, unread, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    next(err);
  }
};

exports.markOneRead = async (req, res, next) => {
  try {
    const notification = await notificationRepo.markReadById(req.params.id, req.user.userId);
    if (!notification) {
      return error(res, 'Notification not found', 404, 'NOT_FOUND');
    }
    success(res, notification);
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const result = await notificationRepo.markAllReadByUser(req.user.userId);
    success(res, { message: 'All notifications marked as read', modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};
