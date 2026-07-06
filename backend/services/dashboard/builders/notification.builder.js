/**
 * Notification Builder
 */
const Notification = require('../../../models/Notification');
const User = require('../../../models/User');

async function buildNotifications(studentId) {
  // We need the user_id since Notification is tied to User, not Student
  const student = require('../../../models/Student');
  const s = await student.findById(studentId).select('user_id').lean();
  
  if (!s) return { unread: 0, items: [] };

  const [items, unread] = await Promise.all([
    Notification.find({ user_id: s.user_id })
      .sort({ created_at: -1 })
      .limit(5)
      .lean(),
    Notification.countDocuments({ user_id: s.user_id, is_read: false })
  ]);

  return {
    unread,
    items: items.map(n => ({
      id: n._id.toString(),
      title: n.title,
      type: n.type,
      created_at: n.created_at
    }))
  };
}

module.exports = { buildNotifications };
