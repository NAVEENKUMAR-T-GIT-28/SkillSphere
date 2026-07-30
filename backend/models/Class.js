/**
 * Class Model V2
 * One document per unique academic cohort.
 * This is the ultimate source of truth for academic state.
 */

const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    batch_start: {
      type: Number,
      required: [true, 'Batch start year is required']
    },
    batch_end: {
      type: Number,
      required: [true, 'Batch end year is required']
    },
    current_year: {
      type: Number,
      required: [true, 'Current year is required'],
      min: 1,
      max: 4
    },
    current_semester: {
      type: Number,
      required: [true, 'Current semester is required'],
      min: 1,
      max: 8
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true
    },
    advisor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    capacity: {
      type: Number,
      default: 60,
      min: 1
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'CLOSED'],
      default: 'ACTIVE'
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // --- Legacy Fields (Phase A Dual-Write/Migration) ---
    batch_year: { type: Number },
    graduation_year: { type: Number },
    academic_year: { type: Number },
    semester: { type: Number },
    is_active: { type: Boolean }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// One class per dept + section + batch_start — no duplicates allowed
classSchema.index({ department: 1, section: 1, batch_start: 1 }, { unique: true });
classSchema.index({ department: 1, current_year: 1 });
classSchema.index({ current_semester: 1 });
classSchema.index({ status: 1 });

// Human-readable identifier, e.g. "CSE-A-2023"
classSchema.virtual('label').get(function () {
  return `${this.department}-${this.section}-${this.batch_start}`;
});

classSchema.virtual('display_name').get(function () {
  return `${this.department} • Year ${this.current_year} • Section ${this.section}`;
});

classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);