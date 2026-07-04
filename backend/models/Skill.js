/**
 * Skill Model
 * One document per skill per student. Referenced, not embedded.
 * skill_name is denormalized from taxonomy for fast reads.
 */

const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    taxonomy_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SkillTaxonomy',
      required: true
    },
    skill_name: {
      type: String,
      required: true,
      trim: true
    },

    proficiency: {
      type: String,
      required: true,
      enum: {
        values: ['beginner', 'intermediate', 'advanced', 'expert'],
        message: '{VALUE} is not a valid proficiency level'
      }
    },
    evidence_note: {
      type: String,
      trim: true
      // Required if proficiency is advanced or expert — validated in route
    },

    years_experience: { type: Number, min: 0, max: 50 },
    projects_using_skill: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    }],

    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verified_at: {
      type: Date
    },
    rejection_reason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes
skillSchema.index({ student_id: 1 });
skillSchema.index({ student_id: 1, status: 1 });
skillSchema.index({ taxonomy_id: 1, status: 1 });
// Prevent duplicate skill per student
skillSchema.index({ student_id: 1, taxonomy_id: 1 }, { unique: true });

module.exports = mongoose.model('Skill', skillSchema);
