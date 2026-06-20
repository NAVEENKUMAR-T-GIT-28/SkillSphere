/**
 * SkillRackScore Model
 * Computed peer-relative SkillRack scores.
 */

const mongoose = require('mongoose');

const skillRackScoreSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },

    // Inputs snapshot
    raw_points:         { type: Number, required: true },
    semester_threshold: { type: Number, required: true },
    threshold_met:      { type: Boolean, required: true },

    // Peer group ranking
    peer_rank:  { type: Number, default: null },
    peer_total: { type: Number, default: null },

    // Score breakdown
    base_score:  { type: Number, required: true },   // 0.0 – 9.0
    rank_bonus:  { type: Number, default: 0 },       // 0.0 – 0.80 (updated to include old medal weight)
    cert_bonus:  { type: Number, default: 0 },       // 0.0 – 0.20
    bonus_score: { type: Number, default: 0 },       // 0.0 – 1.0
    final_score: { type: Number, required: true },   // 0.0 – 10.0

    last_computed_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

skillRackScoreSchema.index({ class_id: 1, final_score: -1 });
skillRackScoreSchema.index({ class_id: 1, peer_rank: 1 });

module.exports = mongoose.model('SkillRackScore', skillRackScoreSchema);
