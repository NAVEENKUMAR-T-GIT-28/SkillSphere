/**
 * Placement Drive Model
 * Each placement drive created by placement officer or HOD.
 * Eligibility rules stored as embedded object, evaluated at query time.
 */

const mongoose = require('mongoose');

const placementDriveSchema = new mongoose.Schema(
  {
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    company_name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    role_title: {
      type: String,
      required: [true, 'Role title is required'],
      trim: true
    },
    job_description_url: {
      type: String,
      trim: true
    },
    ctc: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    drive_date: {
      type: Date,
      required: [true, 'Drive date is required']
    },
    application_deadline: {
      type: Date,
      required: [true, 'Application deadline is required']
    },
    openings: {
      type: Number,
      min: 0
    },
    drive_type: {
      type: String,
      required: true,
      enum: {
        values: ['oncampus', 'offcampus', 'internship'],
        message: '{VALUE} is not a valid drive type'
      }
    },

    // Eligibility rules — evaluated at query time
    eligibility: {
      min_cgpa: { type: Number, default: 0 },
      batch_years: [{ type: Number }],
      departments: [{ type: String, trim: true }],
      sections: [{ type: String, trim: true }],
      class_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
      required_skills: [{ type: String, trim: true }],
      min_readiness_score: { type: Number, default: 0 }
    },

    status: {
      type: String,
      enum: ['upcoming', 'active', 'closed'],
      default: 'upcoming'
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes
placementDriveSchema.index({ status: 1 });
placementDriveSchema.index({ drive_date: 1 });
placementDriveSchema.index({ application_deadline: 1 });

module.exports = mongoose.model('PlacementDrive', placementDriveSchema);