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
    profile_photo_url: {
      type: String,
      trim: true
    },
    career_objective: {
      type: String,
      maxlength: [500, 'Career objective cannot exceed 500 characters']
    },

    // Academic
    roll_number: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    batch_year: {
      type: Number,
      required: [true, 'Batch year is required']
    },
    graduation_year: {
      type: Number,
      required: [true, 'Graduation year is required']
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
studentSchema.index({ department: 1, batch_year: 1, section: 1 });
studentSchema.index({ cgpa: 1 });
studentSchema.index({ readiness_score: -1 });

/**
 * Calculate profile completeness percentage.
 * Checks which fields are filled and returns a 0-100 score.
 */
studentSchema.methods.calculateCompleteness = function () {
  const fields = [
    { name: 'full_name', weight: 10 },
    { name: 'phone', weight: 5 },
    { name: 'profile_photo_url', weight: 5 },
    { name: 'career_objective', weight: 10 },
    { name: 'roll_number', weight: 5 },
    { name: 'department', weight: 5 },
    { name: 'batch_year', weight: 5 },
    { name: 'graduation_year', weight: 5 },
    { name: 'section', weight: 5 },
    { name: 'semester', weight: 5 },
    { name: 'cgpa', weight: 10 }
  ];

  const linkFields = ['github', 'linkedin', 'portfolio'];
  const linkWeight = 30; // 30% total for links

  let score = 0;

  // Check main fields
  for (const field of fields) {
    if (this[field.name] !== undefined && this[field.name] !== null && this[field.name] !== '') {
      score += field.weight;
    }
  }

  // Check links (any filled link contributes proportionally)
  let filledLinks = 0;
  if (this.links) {
    for (const link of linkFields) {
      if (this.links[link]) filledLinks++;
    }
  }
  score += Math.round((filledLinks / linkFields.length) * linkWeight);

  return Math.min(score, 100);
};

// Recalculate completeness before save
studentSchema.pre('save', function (next) {
  if (this.isModified()) {
    this.profile_completeness = this.calculateCompleteness();
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
