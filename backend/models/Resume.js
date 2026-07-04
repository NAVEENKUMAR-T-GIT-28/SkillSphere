/**
 * Resume Model
 * Multiple versions per student. Drive link only. Latest version drives ATS display.
 */

const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    version: {
      type: Number,
      required: true
    },
    drive_link: {
      type: String,
      required: [true, 'Drive link to resume is required'],
      trim: true
    },
    label: {
      type: String,
      trim: true
    },
    resume_version_name: { type: String, trim: true },
    ats_score: { type: Number, min: 0, max: 100 },
    keywords: [{ type: String, trim: true }],
    missing_keywords: [{ type: String, trim: true }],
    parsed_skills: [{ type: String, trim: true }],
    is_latest: {
      type: Boolean,
      default: true
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Indexes
resumeSchema.index({ student_id: 1 });
resumeSchema.index({ student_id: 1, is_latest: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
