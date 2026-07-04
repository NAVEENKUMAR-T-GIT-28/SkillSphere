/**
 * Verification Log Model
 * Immutable audit trail. Append-only — no updates or deletes allowed.
 */

const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema(
  {
    item_type: {
      type: String,
      required: true,
      enum: {
        values: ['skill', 'certification', 'project', 'internship', 'achievement'],
        message: '{VALUE} is not a valid item type'
      }
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    actor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: {
        values: ['submitted', 'approved', 'rejected', 'clarification_requested'],
        message: '{VALUE} is not a valid action'
      }
    },
    comment: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Indexes
verificationLogSchema.index({ item_type: 1, item_id: 1 });
verificationLogSchema.index({ student_id: 1 });
verificationLogSchema.index({ actor_id: 1 });
verificationLogSchema.index({ timestamp: -1 });

// Enforce append-only — prevent updates
verificationLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('verification_logs is append-only — updates are not allowed');
});
verificationLogSchema.pre('updateOne', function () {
  throw new Error('verification_logs is append-only — updates are not allowed');
});
verificationLogSchema.pre('updateMany', function () {
  throw new Error('verification_logs is append-only — updates are not allowed');
});
verificationLogSchema.pre('findOneAndDelete', function () {
  throw new Error('verification_logs is append-only — deletes are not allowed');
});
verificationLogSchema.pre('deleteOne', function () {
  throw new Error('verification_logs is append-only — deletes are not allowed');
});
verificationLogSchema.pre('deleteMany', function () {
  throw new Error('verification_logs is append-only — deletes are not allowed');
});

module.exports = mongoose.model('VerificationLog', verificationLogSchema);
