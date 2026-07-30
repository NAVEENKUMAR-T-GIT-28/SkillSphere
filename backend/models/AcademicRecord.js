const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    semester: {
      type: Number,
      required: true
    },
    academic_year: {
      type: Number,
      required: true
    },
    sgpa: {
      type: Number
    },
    cgpa: {
      type: Number,
      required: true
    },
    current_backlogs: {
      type: Number,
      default: 0
    },
    total_backlogs: {
      type: Number,
      default: 0
    },
    record_version: {
      type: Number,
      default: 1
    },
    published_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

academicRecordSchema.index({ student_id: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);
