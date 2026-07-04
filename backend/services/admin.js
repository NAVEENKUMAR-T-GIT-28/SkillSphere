/**
 * services/admin.js
 * Admin business workflows.
 * Handles HOD account creation (User + Faculty profile).
 */

const userRepo = require('../repositories/userRepo');
const facultyRepo = require('../repositories/facultyRepo');

/**
 * Create a new HOD account.
 * Orchestrates: email uniqueness check → User creation → Faculty profile creation.
 */
const createHod = async ({ email, password, full_name, department, employee_id, phone, designation }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    err.code = 'EMAIL_EXISTS';
    throw err;
  }

  const user = await userRepo.create({ email, password, base_role: 'hod' });
  const profile = await facultyRepo.create({
    user_id: user._id,
    full_name,
    department,
    employee_id,
    designation: designation || 'Head of Department',
    phone
  });

  return { userId: user._id, profileId: profile._id };
};

module.exports = { createHod };
