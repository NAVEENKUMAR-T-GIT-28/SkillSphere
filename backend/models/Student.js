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

    // Academic history (Cached from AcademicRecord)
    latest_cgpa: { type: Number, default: 0 },
    active_backlogs: { type: Number, default: 0 },
    tenth_percentage: { type: Number, min: 0, max: 100 },
    twelfth_percentage: { type: Number, min: 0, max: 100 },

    // Career preferences (Phase 1 enhancement)
    preferred_job_role: { type: String, trim: true },
    preferred_work_location: { type: String, trim: true },

    // Academic Identity
    roll_number: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true
    },
    register_number: {
      type: String,
      sparse: true,
      unique: true,
      trim: true
    },
    academic_status: {
      type: String,
      enum: ['ENROLLED', 'GRADUATED', 'ALUMNI', 'DROPPED', 'TRANSFERRED'],
      default: 'ENROLLED'
    },
    personal_email: {
      type: String,
      trim: true,
      lowercase: true
    },

    // Legacy Fields (DEPRECATED - Will be removed once StudentProgressBuilder is active)
    department: { type: String, trim: true }, // DEPRECATED
    section: { type: String, trim: true }, // DEPRECATED
    semester: { type: Number, min: 1, max: 8 }, // DEPRECATED
    batch_year: { type: Number }, // DEPRECATED
    graduation_year: { type: Number }, // DEPRECATED
    cgpa: { type: Number, min: 0, max: 10 }, // DEPRECATED
    current_backlogs: { type: Number, default: 0, min: 0 }, // DEPRECATED
    backlog_history: { type: Number, default: 0, min: 0 }, // DEPRECATED
    profile_completeness: { type: Number, default: 0, min: 0, max: 100 }, // DEPRECATED

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
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes (user_id and roll_number already have unique:true in schema)
studentSchema.index({ class_id: 1 });
studentSchema.index({ readiness_score: -1 });

// No longer calculating completeness on save since it's dynamic.

module.exports = mongoose.model('Student', studentSchema);
