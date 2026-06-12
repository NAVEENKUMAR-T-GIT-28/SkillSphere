/**
 * Certification Model
 * One document per certification per student. Drive link instead of file upload.
 */

const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },

    title: {
      type: String,
      required: [true, 'Certificate title is required'],
      trim: true
    },
    issuer: {
      type: String,
      required: [true, 'Issuer is required'],
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: {
        values: ['technical', 'language', 'soft_skills', 'domain', 'academic'],
        message: '{VALUE} is not a valid certification category'
      }
    },
    issue_date: {
      type: Date,
      required: [true, 'Issue date is required']
    },
    expiry_date: {
      type: Date,
      default: null
    },
    credential_id: {
      type: String,
      trim: true
    },
    verification_url: {
      type: String,
      trim: true
    },

    drive_link: {
      type: String,
      required: [true, 'Drive link to certificate is required'],
      trim: true
    },

    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired'],
      default: 'pending'
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verified_at: {
      type: Date
    },
    rejection_reason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes
certificationSchema.index({ student_id: 1 });
certificationSchema.index({ student_id: 1, status: 1 });
certificationSchema.index({ expiry_date: 1 }); // for expiry alert cron job

module.exports = mongoose.model('Certification', certificationSchema);
