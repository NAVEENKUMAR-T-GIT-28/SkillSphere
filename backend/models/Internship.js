/**
 * Internship Model
 * One document per internship a student has completed or is doing.
 * Verified by faculty, same lifecycle as Certification.
 */

const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    role: {
      type: String,
      required: [true, 'Role/title is required'],
      trim: true
    },
    start_date: { type: Date, required: [true, 'Start date is required'] },
    end_date: { type: Date },
    duration_months: { type: Number, min: 0 },
    stipend: { type: Number, min: 0 },
    certificate_url: { type: String, trim: true },
    offer_letter_url: { type: String, trim: true },

    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verified_at: { type: Date },
    rejection_reason: { type: String, trim: true }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

internshipSchema.index({ student_id: 1 });
internshipSchema.index({ student_id: 1, status: 1 });

module.exports = mongoose.model('Internship', internshipSchema);
