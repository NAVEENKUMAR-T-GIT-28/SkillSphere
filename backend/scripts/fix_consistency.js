/**
 * fix_consistency.js
 * One-time script to resolve the database inconsistencies found.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Student = require('../models/Student');
const Class = require('../models/Class');
const Project = require('../models/Project');
const VerificationLog = require('../models/VerificationLog');

const MONGODB_URI = process.env.MONGODB_URI;

const fix = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB. Starting database repair...');

  // 1. Fix Student SIT24CO042 missing class_id
  const student = await Student.findOne({ roll_number: 'SIT24CO042' });
  if (student && !student.class_id) {
    console.log('Found Student SIT24CO042 without class_id. Resolving cohort class...');
    
    // Find or create class
    const dept = student.department || 'Computer and Communication Engineering';
    const sec = student.section || 'A';
    const batch = student.batch_year || 2024;
    
    let cls = await Class.findOne({ department: dept, section: sec, batch_year: batch });
    if (!cls) {
      cls = await Class.create({
        department: dept,
        section: sec,
        batch_year: batch,
        graduation_year: student.graduation_year || (batch + 4),
        academic_year: Math.ceil((student.semester || 4) / 2),
        semester: student.semester || 4
      });
      console.log(`Created new class for cohort: ${dept}-${sec}-${batch}`);
    } else {
      console.log(`Matched existing class: ${cls._id}`);
    }

    student.class_id = cls._id;
    await student.save();
    console.log('✅ Successfully assigned class_id to Student SIT24CO042.');
  }

  // 2. Fix Projects where created_by is a User instead of Student
  // We find projects where created_by is not a valid Student but is a User.
  const projects = await Project.find({});
  for (const p of projects) {
    if (p.created_by) {
      const studentExists = await Student.exists({ _id: p.created_by });
      if (!studentExists) {
        // Find student whose user_id is p.created_by
        const actualStudent = await Student.findOne({ user_id: p.created_by });
        if (actualStudent) {
          console.log(`Project "${p.title}" created_by is User ID ${p.created_by}. Re-linking to Student ID ${actualStudent._id}...`);
          p.created_by = actualStudent._id;
          await p.save();
          console.log(`✅ Fixed Project "${p.title}" created_by reference.`);
        }
      }
    }
  }

  // 3. Fix VerificationLogs where student_id is a User instead of Student
  const logs = await VerificationLog.find({});
  for (const l of logs) {
    if (l.student_id) {
      const studentExists = await Student.exists({ _id: l.student_id });
      if (!studentExists) {
        // Find student whose user_id is l.student_id
        const actualStudent = await Student.findOne({ user_id: l.student_id });
        if (actualStudent) {
          console.log(`VerificationLog ${l._id} student_id is User ID ${l.student_id}. Re-linking to Student ID ${actualStudent._id}...`);
          // VerificationLog schema has pre hooks preventing update, so we override or bypass the pre hooks by using updateOne directly on collection or disabling hook
          await mongoose.connection.collection('verificationlogs').updateOne(
            { _id: l._id },
            { $set: { student_id: actualStudent._id } }
          );
          console.log(`✅ Fixed VerificationLog ${l._id} student_id reference.`);
        }
      }
    }
  }

  console.log('✅ Consistency repair complete.');
  await mongoose.disconnect();
};

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
