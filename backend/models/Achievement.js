/**
 * Achievement Model
 * Unified collection for hackathons, papers, patents, awards, sports, NCC/NSS, etc.
 * Same verification lifecycle as Certification/Internship.
 */

const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['hackathon', 'paper', 'patent', 'award', 'sports', 'ncc', 'nss', 'volunteer', 'competition', 'club', 'other'],
        message: '{VALUE} is not a valid achievement category'
      }
    },
    custom_category: { type: String, trim: true },
    issuer: { type: String, trim: true },
    date: { type: Date },
    image_url: { type: String, trim: true },
    description: { type: String, maxlength: [500, 'Description cannot exceed 500 characters'], trim: true },
    certificate_url: { type: String, trim: true },

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

achievementSchema.index({ student_id: 1 });
achievementSchema.index({ student_id: 1, category: 1 });
achievementSchema.index({ student_id: 1, status: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
