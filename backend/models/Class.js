/**
 * Class Model
 * One document per unique class section for a specific batch.
 * Centralises semester, academic year, and cohort identity.
 * Advancing semester = one updateMany on this collection, not N student writes.
 */

const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
      // e.g. "CCE", "CSE", "ECE"
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true
      // e.g. "A", "B", "C"
    },
    batch_year: {
      type: Number,
      required: [true, 'Batch year is required']
      // Year of admission — stable identifier. e.g. 2023
    },
    graduation_year: {
      type: Number,
      required: [true, 'Graduation year is required']
      // Derived: batch_year + 4 for 4-year programmes
    },
    academic_year: {
      type: Number,
      required: true,
      min: 1,
      max: 4
      // Current year of study (1–4). Updated once per academic year.
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8
      // Current semester (1–8). Updated twice per academic year.
    },
    is_active: {
      type: Boolean,
      default: true
      // Graduated batches are set to false and excluded from live rankings.
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// One class per dept + section + batch — no duplicates allowed
classSchema.index({ department: 1, section: 1, batch_year: 1 }, { unique: true });

// Peer group queries: all sections of a department in a given academic year
classSchema.index({ department: 1, academic_year: 1 });

// Threshold lookups by semester
classSchema.index({ semester: 1 });

// Human-readable identifier, e.g. "Computer Science-A-2023"
classSchema.virtual('label').get(function () {
  return `${this.department}-${this.section}-${this.batch_year}`;
});

classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);