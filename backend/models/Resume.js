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

    // ── ATS Engine fields (additive — see backend/ats/) ──────────────────
    ats_grade: { type: String },
    ats_breakdown: { type: mongoose.Schema.Types.Mixed },
    ats_summary: { type: String },
    ats_last_analyzed: { type: Date },
    parsed_resume: { type: mongoose.Schema.Types.Mixed }, // structured extraction + per-field confidence
    extracted_text: { type: String },
    parsing_warnings: [{ type: String, trim: true }],
    engine_version: { type: String }, // semantic version, e.g. "1.0.0"

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
