/**
 * Application Model
 * Student × Drive join table. One document per student per drive.
 * Tracks application status through the placement pipeline.
 */

const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    drive_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: true
    },

    status: {
      type: String,
      enum: ['eligible', 'applied', 'shortlisted', 'round1', 'round2', 'selected', 'rejected'],
      default: 'eligible'
    },
    applied_at: {
      type: Date
    },
    last_status_update: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

// Indexes
applicationSchema.index({ drive_id: 1 });
applicationSchema.index({ student_id: 1 });
applicationSchema.index({ drive_id: 1, status: 1 });
// Prevent duplicate application per student per drive
applicationSchema.index({ student_id: 1, drive_id: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
