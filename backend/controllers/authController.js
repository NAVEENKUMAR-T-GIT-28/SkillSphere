// controllers/authController.js
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/userRepo');
const studentRepo = require('../repositories/studentRepo');
const facultyRepo = require('../repositories/facultyRepo');
const { getKeys } = require('../utils/jwtKeys');
const { success, error } = require('../utils/response');
const { JWT_EXPIRES_IN } = require('../config/env');

const generateToken = (user) => {
  const { privateKey } = getKeys();
  return jwt.sign(
    { userId: user._id, baseRole: user.base_role },
    privateKey,
    { 
      algorithm: 'RS256',
      expiresIn: JWT_EXPIRES_IN 
    }
  );
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const { email, password, base_role, full_name, phone, department } = req.body;

    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return error(res, 'Email already registered', 409, 'EMAIL_EXISTS');
    }

    const user = await userRepo.create({ email, password, base_role });
    let profile;

    if (base_role === 'student') {
      const { roll_number, batch_year, graduation_year, section, semester, cgpa } = req.body;
      profile = await studentRepo.create({
        user_id: user._id, full_name, phone, roll_number, department, batch_year, graduation_year, section, semester, cgpa
      });
    } else {
      const { employee_id, designation } = req.body;
      profile = await facultyRepo.create({
        user_id: user._id, full_name, department, designation, employee_id, phone
      });
    }

    const token = generateToken(user);
    success(res, {
      token,
      user: { id: user._id, email: user.email, baseRole: user.base_role, name: full_name, profileId: profile._id }
    }, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const { email, password } = req.body;
    const user = await userRepo.findByEmailWithPassword(email);
    if (!user) {
      return error(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      return error(res, 'Account has been deactivated. Contact your HOD.', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return error(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
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
    success(res, {
      token,
      user: { id: user._id, email: user.email, baseRole: user.base_role, name, profileId }
    });
  } catch (err) {
    next(err);
  }
};
