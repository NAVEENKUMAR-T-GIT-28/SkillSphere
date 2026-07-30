const mongoose = require('mongoose');

const institutionSettingsSchema = new mongoose.Schema(
  {
    login_strategy: {
      type: String,
      enum: ['EMAIL', 'ROLL_NUMBER', 'REGISTER_NUMBER'],
      default: 'ROLL_NUMBER'
    },
    mentor_capacity: {
      type: Number,
      default: 20
    },
    grading_scale: {
      type: Number,
      default: 10
    },
    password_policy: {
      min_length: { type: Number, default: 12 },
      require_special: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('InstitutionSettings', institutionSettingsSchema);
