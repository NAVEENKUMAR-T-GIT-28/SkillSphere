/**
 * Faculty Model
 * Faculty profile. One record per faculty user.
 */

const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    full_name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    designation: {
      type: String,
      trim: true
    },
    employee_id: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes (user_id and employee_id already have unique:true in schema)

module.exports = mongoose.model('Faculty', facultySchema);
