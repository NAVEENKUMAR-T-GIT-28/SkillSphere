/**
 * User Model
 * Auth credentials and base role. Every person in the system has a user record.
 * Password is stored as bcrypt hash (saltRounds: 12).
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    login_identifier: {
      type: String,
      required: [true, 'Login identifier is required'],
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // exclude from queries by default
    },
    base_role: {
      type: String,
      required: [true, 'Base role is required'],
      enum: {
        values: ['student', 'faculty', 'hod', 'admin'],
        message: '{VALUE} is not a valid role'
      }
    },
    is_active: {
      type: Boolean,
      default: true
    },
    account_status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'DISABLED', 'LOCKED'],
      default: 'ACTIVE'
    },
    must_change_password: {
      type: Boolean,
      default: false
    },
    first_login_at: {
      type: Date,
      default: null
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
