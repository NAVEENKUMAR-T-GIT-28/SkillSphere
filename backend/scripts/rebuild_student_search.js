/**
 * rebuild_student_search.js
 * One-time (or periodic) script to rebuild all StudentSearch documents
 * from live source collections. Safe to re-run: uses upsert.
 *
 * Run: node scripts/rebuild_student_search.js
 *   or: npm run rebuild:search
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const { syncStudentSearch } = require('../services/studentSearchSync');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

async function rebuildAll() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const students = await Student.find({}, '_id');
  console.log(`Found ${students.length} students to sync`);

  let ok = 0, failed = 0;
  for (const s of students) {
    try {
      await syncStudentSearch(s._id);
      ok++;
    } catch (err) {
      failed++;
      console.error(`Failed to sync ${s._id}:`, err.message);
    }
  }
  console.log(`\nStudentSearch rebuild complete: ${ok} synced, ${failed} failed.`);

  await mongoose.disconnect();
}

rebuildAll().catch(err => {
  console.error('❌ Rebuild failed:', err);
  process.exit(1);
});
