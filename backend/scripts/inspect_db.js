/**
 * inspect_db.js
 * Inspects specific records to help plan the data consistency fixes.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Student = require('../models/Student');
const User = require('../models/User');
const Project = require('../models/Project');
const VerificationLog = require('../models/VerificationLog');

const MONGODB_URI = process.env.MONGODB_URI;

const inspect = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // 1. Inspect Student SIT24CO042
  const s = await Student.findOne({ roll_number: 'SIT24CO042' });
  if (s) {
    console.log('\n--- Student SIT24CO042 ---');
    console.log(JSON.stringify(s.toObject(), null, 2));
    
    // Also inspect their User
    const u = await User.findById(s.user_id);
    console.log('Associated User:', u ? JSON.stringify(u.toObject(), null, 2) : 'None');
  } else {
    // If not found by roll number, try by ID
    const sById = await Student.findById('6a2b8e9b97420b7c6eaa96ed');
    if (sById) {
      console.log('\n--- Student by ID 6a2b8e9b97420b7c6eaa96ed ---');
      console.log(JSON.stringify(sById.toObject(), null, 2));
      const u = await User.findById(sById.user_id);
      console.log('Associated User:', u ? JSON.stringify(u.toObject(), null, 2) : 'None');
    } else {
      console.log('\nStudent SIT24CO042/6a2b8e9b97420b7c6eaa96ed not found');
    }
  }

  // 2. Inspect Project and see if there is any other student
  const p = await Project.findById('6a2e4b5e0004a27c3a7881db');
  if (p) {
    console.log('\n--- Project E-commer ---');
    console.log(JSON.stringify(p.toObject(), null, 2));
  }

  // 3. Inspect Verification Log
  const log = await VerificationLog.findById('6a2e4c5a0004a27c3a78829f');
  if (log) {
    console.log('\n--- Verification Log ---');
    console.log(JSON.stringify(log.toObject(), null, 2));
  }

  await mongoose.disconnect();
};

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
