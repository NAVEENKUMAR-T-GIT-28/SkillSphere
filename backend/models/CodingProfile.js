/**
 * Coding Profile Model
 * One document per platform per student.
 * Manual stats entry in MVP (auto-sync in Phase 2).
 */

const mongoose = require('mongoose');

const codingProfileSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    platform: {
      type: String,
      required: true,
      enum: {
        values: ['leetcode', 'hackerrank', 'codechef', 'skillrack', 'github', 'codeforces'],
        message: '{VALUE} is not a valid platform'
      }
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true
    },
    profile_url: {
      type: String,
      required: [true, 'Profile URL is required'],
      trim: true
    },

    // Manually entered stats in MVP
    problems_solved: {
      type: Number,
      default: 0,
      min: 0
    },
    contest_rating: {
      type: Number,
      default: 0,
      min: 0
    },
    badges: [{
      type: String,
      trim: true
    }],

    // SkillRack-specific stats (only populated when platform === 'skillrack')
    skillrack_stats: {
      // Activity counters — these feed the raw_points formula
      // raw_points = (code_track × 2) + (dc × 2) + (dt × 20) + (code_test × 30)
      code_track:   { type: Number, default: 0 },   // API field: codeTrack
      dc:           { type: Number, default: 0 },   // API field: dc
      dt:           { type: Number, default: 0 },   // API field: dt
      code_test:    { type: Number, default: 0 },   // API field: codeTest  ×30
      code_tutor:   { type: Number, default: 0 },   // API field: codeTutor — stored, weight = 0

      // Problem counts — display only, do NOT feed into raw_points
      solved:       { type: Number, default: 0 },   // API field: solved

      // Language-wise solved counts — display only
      languages: {
        type: Map,
        of: Number,
        default: {}
      },

      // Medals
      badges: {
        gold:   { type: Number, default: 0 },
        silver: { type: Number, default: 0 },
        bronze: { type: Number, default: 0 }
      },

      // Platform metadata — display only
      sr_rank:         { type: Number, default: null },  // API field: rank
      level:           { type: String, default: null },  // API field: level
      sr_certificates: { type: Number, default: 0 },    // API field: certificates

      // Computed at sync time — denormalized for fast reads in scoring engine
      raw_points: { type: Number, default: 0 }
    },

    last_updated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

// Indexes
codingProfileSchema.index({ student_id: 1 });
codingProfileSchema.index({ student_id: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('CodingProfile', codingProfileSchema);
