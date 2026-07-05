/**
 * CodingProfile Model
 * ONE document per student. Each linked platform is stored as an embedded
 * object under `platforms.<platformName>`, holding exactly what that
 * platform's sync service returned. No cross-platform normalization —
 * each platform's shape is its own business.
 */

const mongoose = require('mongoose');

const codingProfileSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      unique: true
    },

    // Each key below is added dynamically when a student links that platform.
    // Shape is intentionally loose (Mixed) — each platform service owns its own shape.
    platforms: {
      // LeetCode API
      leetcode: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },
      // HackerRank API 
      hackerrank: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },
      // SkillRack Scraper
      skillrack: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      },
      // GitHub REST API
      github: {
          type: mongoose.Schema.Types.Mixed,
          default: null
      }
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Index on student_id is already created via `unique: true` in the field definition above.

module.exports = mongoose.model('CodingProfile', codingProfileSchema);
