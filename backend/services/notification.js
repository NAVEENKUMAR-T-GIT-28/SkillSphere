// services/notification.js
const notificationRepo = require('../repositories/notificationRepo');

const createNotification = async ({ user_id, type, title, message, link }) => {
  return notificationRepo.create({
    user_id,
    type,
    title,
    message,
    link,
    is_read: false
  });
};

const notifyVerificationApproved = async (studentUserId, itemType, itemName) => {
  return createNotification({
    user_id: studentUserId,
    type: 'verification_approved',
    title: `${itemType} Verified`,
    message: `Your ${itemType.toLowerCase()} "${itemName}" has been verified and approved.`,
    link: `/${itemType.toLowerCase()}s`
  });
};

const notifyVerificationRejected = async (studentUserId, itemType, itemName, reason) => {
  return createNotification({
    user_id: studentUserId,
    type: 'verification_rejected',
    title: `${itemType} Rejected`,
    message: `Your ${itemType.toLowerCase()} "${itemName}" was rejected. Reason: ${reason || 'No reason provided.'}`,
    link: `/${itemType.toLowerCase()}s`
  });
};

const notifyDriveAnnounced = async (userIds, companyName, roleTitle, driveId) => {
  const notifications = userIds.map(user_id => ({
    user_id,
    type: 'drive_announced',
    title: 'New Placement Drive',
    message: `${companyName} is hiring for ${roleTitle}. Check eligibility and apply!`,
    link: `/placement-drives/${driveId}`,
    is_read: false
  }));

  return notificationRepo.insertMany(notifications);
};

const notifyScoreUpdated = async (studentUserId, newScore, newTier) => {
  return createNotification({
    user_id: studentUserId,
    type: 'score_updated',
    title: 'Readiness Score Updated',
    message: `Your readiness score is now ${newScore}/100 (${newTier.replace('_', ' ')}).`,
    link: '/profile'
  });
};

const notifyRoleAssigned = async (userId, role, scopeLabel) => {
  return createNotification({
    user_id: userId,
    type: 'role_assigned',
    title: 'Role Assigned',
    message: `You have been assigned the role of ${role.toUpperCase()} for ${scopeLabel}.`,
    link: '/dashboard'
  });
};

module.exports = {
  createNotification,
  notifyVerificationApproved,
  notifyVerificationRejected,
  notifyDriveAnnounced,
  notifyScoreUpdated,
  notifyRoleAssigned
};
