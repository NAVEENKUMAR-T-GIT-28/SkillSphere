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
