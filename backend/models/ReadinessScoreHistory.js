/**
 * Readiness Score History Model
 * Snapshot of score every time it's recalculated.
 * Used for trend graphs in Phase 2.
 */

const mongoose = require('mongoose');

const readinessScoreHistorySchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    tier: {
      type: String,
      required: true,
      enum: ['beginner', 'developing', 'placement_ready', 'industry_ready']
    },
    breakdown: {
      skills_score: { type: Number, default: 0 },
      certs_score: { type: Number, default: 0 },
      projects_score: { type: Number, default: 0 },
      coding_score: { type: Number, default: 0 },
      faculty_score: { type: Number, default: 0 }
    },
    calculated_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Indexes
readinessScoreHistorySchema.index({ student_id: 1, calculated_at: -1 });

module.exports = mongoose.model('ReadinessScoreHistory', readinessScoreHistorySchema);
