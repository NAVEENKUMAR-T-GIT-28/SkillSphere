/**
 * Notification Service
 * Creates notification records for key events in the system.
 * Call these functions after relevant actions to keep users informed.
 */

const Notification = require('../models/Notification');
const Student = require('../models/Student');

/**
 * Create a notification for a specific user.
 */
const createNotification = async ({ user_id, type, title, message, link }) => {
  return Notification.create({
    user_id,
    type,
    title,
    message,
    link
  });
};

/**
 * Notify student that their item was approved.
 * @param {ObjectId} studentUserId - the student's User._id
 */
const notifyVerificationApproved = async (studentUserId, itemType, itemName) => {
  return createNotification({
    user_id: studentUserId,
    type: 'verification_approved',
    title: `${itemType} Verified`,
    message: `Your ${itemType.toLowerCase()} "${itemName}" has been verified and approved.`,
    link: `/${itemType.toLowerCase()}s`
  });
};

/**
 * Notify student that their item was rejected.
 */
const notifyVerificationRejected = async (studentUserId, itemType, itemName, reason) => {
  return createNotification({
    user_id: studentUserId,
    type: 'verification_rejected',
    title: `${itemType} Rejected`,
    message: `Your ${itemType.toLowerCase()} "${itemName}" was rejected. Reason: ${reason || 'No reason provided.'}`,
    link: `/${itemType.toLowerCase()}s`
  });
};

/**
 * Notify all eligible students about a new placement drive.
 */
const notifyDriveAnnounced = async (userIds, companyName, roleTitle, driveId) => {
  const notifications = userIds.map(user_id => ({
    user_id,
    type: 'drive_announced',
    title: 'New Placement Drive',
    message: `${companyName} is hiring for ${roleTitle}. Check eligibility and apply!`,
    link: `/placement-drives/${driveId}`
  }));

  return Notification.insertMany(notifications);
};

/**
 * Notify student that their readiness score was updated.
 */
const notifyScoreUpdated = async (studentUserId, newScore, newTier) => {
  return createNotification({
    user_id: studentUserId,
    type: 'score_updated',
    title: 'Readiness Score Updated',
    message: `Your readiness score is now ${newScore}/100 (${newTier.replace('_', ' ')}).`,
    link: '/profile'
  });
};

/**
 * Notify user that they were assigned a dynamic role.
 */
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
