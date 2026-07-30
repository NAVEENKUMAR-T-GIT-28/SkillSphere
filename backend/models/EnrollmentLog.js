const mongoose = require('mongoose');

const enrollmentLogSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    actor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
);

enrollmentLogSchema.index({ student_id: 1, timestamp: -1 });
enrollmentLogSchema.index({ actor_id: 1 });

module.exports = mongoose.model('EnrollmentLog', enrollmentLogSchema);
