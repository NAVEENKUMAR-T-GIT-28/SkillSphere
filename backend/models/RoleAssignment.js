/**
 * Role Assignment Model
 * Handles all dynamic roles: Rep (student), Mentor (faculty → students), CC (faculty → class).
 * HOD assigns and revokes these. revoked_at = null means currently active.
 */

const mongoose = require('mongoose');

const roleAssignmentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: {
        values: ['rep', 'mentor', 'cc'],
        message: '{VALUE} is not a valid dynamic role'
      }
    },

    // Scope defines what they can access
    scope_type: {
      type: String,
      required: true,
      enum: {
        values: ['student', 'class', 'section'],
        message: '{VALUE} is not a valid scope type'
      }
    },
    scope_id: {
      type: mongoose.Schema.Types.ObjectId
    },
    scope_label: {
      type: String,
      trim: true
    },
    scope_data: {
      department: { type: String, trim: true },
      section: { type: String, trim: true },
      batch_year: { type: Number }
    },

    assigned_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assigned_at: {
      type: Date,
      default: Date.now
    },
    revoked_at: {
      type: Date,
      default: null
    },
    revoke_reason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: false // using assigned_at and revoked_at instead
  }
);

// Indexes
roleAssignmentSchema.index({ user_id: 1, revoked_at: 1 });
roleAssignmentSchema.index({ user_id: 1, role: 1, revoked_at: 1 });

module.exports = mongoose.model('RoleAssignment', roleAssignmentSchema);
