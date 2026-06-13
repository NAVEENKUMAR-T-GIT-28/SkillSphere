/**
 * Project Model
 * One document per project. Team projects link multiple students via student_ids.
 * Includes faculty rating subdocument for evaluation.
 */

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    student_ids: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    }],
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },

    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      trim: true
    },
    tech_stack: [{
      type: String,
      trim: true
    }],
    github_url: {
      type: String,
      required: [true, 'GitHub URL is required'],
      trim: true
    },
    live_demo_url: {
      type: String,
      trim: true
    },
    thumbnail_url: {
      type: String,
      trim: true
    },

    complexity_tier: {
      type: String,
      required: true,
      enum: {
        values: ['basic', 'intermediate', 'advanced'],
        message: '{VALUE} is not a valid complexity tier'
      }
    },

    // Faculty evaluation
    faculty_rating: {
      rated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rated_at: Date,
      functionality: { type: Number, min: 1, max: 5 },
      code_quality: { type: Number, min: 1, max: 5 },
      documentation: { type: Number, min: 1, max: 5 },
      innovation: { type: Number, min: 1, max: 5 },
      complexity: { type: Number, min: 1, max: 5 },
      average: { type: Number },
      feedback: { type: String, trim: true }
    },

    is_featured: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'rejected'],
      default: 'pending'
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
projectSchema.index({ student_ids: 1 });
projectSchema.index({ created_by: 1 });
projectSchema.index({ tech_stack: 1 });

module.exports = mongoose.model('Project', projectSchema);
