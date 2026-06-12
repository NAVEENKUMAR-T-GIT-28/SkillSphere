/**
 * Notification Model
 * In-app notifications. Each user gets their own notification records.
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: [
          'verification_approved',
          'verification_rejected',
          'drive_announced',
          'score_updated',
          'role_assigned',
          'general'
        ],
        message: '{VALUE} is not a valid notification type'
      }
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    is_read: {
      type: Boolean,
      default: false
    },
    link: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

// Indexes
notificationSchema.index({ user_id: 1, is_read: 1 });
notificationSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
