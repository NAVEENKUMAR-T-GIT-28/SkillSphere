/**
 * services/auth.js
 * Authentication business workflows.
 * Handles user registration (multi-role) and login profile resolution.
 */

const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepo');
const studentRepo = require('../repositories/studentRepo');
const facultyRepo = require('../repositories/facultyRepo');
const classRepo = require('../repositories/classRepo');
const { getKeys } = require('../utils/jwtKeys');
const { JWT_EXPIRES_IN } = require('../config/env');

const generateToken = (user) => {
  const { privateKey } = getKeys();
  return jwt.sign(
    { userId: user._id, baseRole: user.base_role },
    privateKey,
    { algorithm: 'RS256', expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Register a new user (student or faculty).
 * Orchestrates: User creation → Profile creation (Student or Faculty) → Class resolution → JWT
 */
const register = async ({ email, password, base_role, full_name, phone, department, ...rest }) => {
  const existingUser = await userRepo.findByEmail(email);
  if (existingUser) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    err.code = 'EMAIL_EXISTS';
    throw err;
  }

  const user = await userRepo.create({ email, password, base_role });
  let profile;

  if (base_role === 'student') {
    const { roll_number, class_id } = rest;

    if (!class_id) {
      const err = new Error('class_id is required to register a student');
      err.statusCode = 400;
      err.code = 'MISSING_CLASS';
      throw err;
    }

    const cls = await classRepo.findById(class_id);
    if (!cls) {
      const err = new Error('Class not found');
      err.statusCode = 404;
      err.code = 'CLASS_NOT_FOUND';
      throw err;
    }

    profile = await studentRepo.create({
      user_id: user._id,
      full_name,
      phone,
      roll_number,
      class_id: cls._id
    });
  } else {
    const { employee_id, designation } = rest;
    profile = await facultyRepo.create({
      user_id: user._id, full_name, department, designation, employee_id, phone
    });
  }

  const token = generateToken(user);
  return {
    token,
    user: { id: user._id, email: user.email, baseRole: user.base_role, name: full_name, profileId: profile._id }
  };
};

/**
 * Login: verify credentials and resolve the user's profile name/id.
 */
const login = async ({ email, password }) => {
  const user = await userRepo.findByEmailWithPassword(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  if (!user.is_active) {
    const err = new Error('Account has been deactivated. Contact your HOD.');
    err.statusCode = 403;
    err.code = 'ACCOUNT_DEACTIVATED';
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  let name = '';
  let profileId = null;
  if (user.base_role === 'student') {
    const student = await studentRepo.findByUserId(user._id);
    name = student?.full_name || '';
    profileId = student?._id || null;
  } else {
    const faculty = await facultyRepo.findByUserId(user._id);
    name = faculty?.full_name || '';
    profileId = faculty?._id || null;
  }

  const token = generateToken(user);
  return {
    token,
    user: { id: user._id, email: user.email, baseRole: user.base_role, name, profileId }
  };
};

module.exports = { register, login };
