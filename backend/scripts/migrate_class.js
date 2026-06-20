/**
 * migrate_class.js
 * One-time migration: creates Class documents from Student data and
 * sets class_id on every Student document.
 *
 * Prerequisites:
 *   1. Class model exists (Track 1 complete)
 *   2. class_id field added to Student schema (Track 2a complete)
 *   3. Old fields (department, section, batch_year, etc.) still on Student schema
 *
 * Run: node scripts/migrate_class.js
 * Safe to re-run: uses upsert for Class creation, skips students that already have class_id
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Student  = require('../models/Student');
const Class    = require('../models/Class');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set');
  process.exit(1);
}

const migrate = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const students = await Student.find({ class_id: { $exists: false } });
  console.log(`Found ${students.length} students without class_id`);

  let created  = 0;
  let reused   = 0;
  let assigned = 0;
  let skipped  = 0;

  for (const student of students) {
    // Skip students missing required class fields (data quality issue)
    if (!student.department || !student.batch_year) {
      console.warn(`  ⚠️  Skipping ${student.roll_number} — missing department or batch_year`);
      skipped++;
      continue;
    }

    const semester     = student.semester     || 1;
    const academicYear = Math.ceil(semester / 2);

    // Find or create the Class for this cohort
    const existingClass = await Class.findOne({
      department: student.department,
      section:    student.section    || 'A',
      batch_year: student.batch_year
    });

    let cls;
    if (existingClass) {
      cls = existingClass;
      reused++;
    } else {
      cls = await Class.create({
        department:      student.department,
        section:         student.section || 'A',
        batch_year:      student.batch_year,
        graduation_year: student.graduation_year || (student.batch_year + 4),
        academic_year:   academicYear,
        semester:        semester
      });
      created++;
      console.log(`  ✅ Created class: ${cls.department}-${cls.section}-${cls.batch_year} (sem ${cls.semester})`);
    }

    // Assign class_id to student
    await Student.updateOne(
      { _id: student._id },
      { $set: { class_id: cls._id } }
    );
    assigned++;
  }

  console.log('\n── Migration Summary ──────────────────');
  console.log(`Classes created:  ${created}`);
  console.log(`Classes reused:   ${reused}`);
  console.log(`Students updated: ${assigned}`);
  console.log(`Students skipped: ${skipped}`);

  // Verify: count students still missing class_id
  const remaining = await Student.countDocuments({ class_id: { $exists: false } });
  if (remaining > 0) {
    console.warn(`\n⚠️  ${remaining} students still missing class_id — inspect manually`);
  } else {
    console.log('\n✅ All students have class_id. Safe to remove old fields from schema.');
  }

  await mongoose.disconnect();
};

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
