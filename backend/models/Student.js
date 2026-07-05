/**
 * Student Model
 * Student profile and academic data. One record per student user.
 * Links (social/coding) are embedded — always fetched with profile, small fixed set.
 * Readiness score and profile completeness are computed fields.
 */

const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class assignment is required']
    },

    // Personal
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    alternate_phone: {
      type: String,
      trim: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      trim: true
    },
    profile_photo_url: {
      type: String,
      trim: true
    },
    career_objective: {
      type: String,
      maxlength: [500, 'Career objective cannot exceed 500 characters']
    },

    // Personal (Phase 1 enhancement)
    date_of_birth: { type: Date },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    pincode: { type: String, trim: true },
    languages_known: [{ type: String, trim: true }],

    // Academic history (Phase 1 enhancement)
    current_backlogs: { type: Number, default: 0, min: 0 },
    backlog_history: { type: Number, default: 0, min: 0 },
    tenth_percentage: { type: Number, min: 0, max: 100 },
    twelfth_percentage: { type: Number, min: 0, max: 100 },

    // Career preferences (Phase 1 enhancement)
    preferred_job_role: { type: String, trim: true },
    preferred_work_location: { type: String, trim: true },

    // Academic
    roll_number: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true
    },
    register_number: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    section: {
      type: String,
      trim: true
    },
    semester: {
      type: Number,
      min: 1,
      max: 8
    },
    batch_year: {
      type: Number
    },
    graduation_year: {
      type: Number
    },
    cgpa: {
      type: Number,
      min: [0, 'CGPA cannot be less than 0'],
      max: [10, 'CGPA cannot exceed 10']
    },

    // Social + coding links (embedded — always fetched with profile, small fixed set)
    links: {
      github: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      portfolio: { type: String, trim: true },
      leetcode: { type: String, trim: true },
      hackerrank: { type: String, trim: true },
      codechef: { type: String, trim: true },
      skillrack: { type: String, trim: true },
      codeforces: { type: String, trim: true }
    },

    // Computed score (recalculated on every verification action)
    readiness_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    readiness_tier: {
      type: String,
      enum: ['beginner', 'developing', 'placement_ready', 'industry_ready'],
      default: 'beginner'
    },

    // Profile completeness %
    profile_completeness: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes (user_id and roll_number already have unique:true in schema)
studentSchema.index({ class_id: 1 });
studentSchema.index({ cgpa: 1 });
studentSchema.index({ readiness_score: -1 });

// No longer calculating completeness on save since it's dynamic.

module.exports = mongoose.model('Student', studentSchema);
