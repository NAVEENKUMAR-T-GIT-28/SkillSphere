const mongoose = require('mongoose');
const Class = require('../models/Class');
const User = require('../models/User');

async function migrateClasses() {
  console.log('Starting Class V2 Migration...');
  const admin = await User.findOne({ base_role: 'admin' }) || await User.findOne({ base_role: 'hod' });
  const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

  const classes = await Class.find({});
  console.log(`Found ${classes.length} classes to migrate.`);

  for (const c of classes) {
    c.batch_start = c.batch_year || c.batch_start || new Date().getFullYear();
    c.batch_end = c.graduation_year || c.batch_end || (c.batch_start + 4);
    c.current_year = c.academic_year || c.current_year || 1;
    c.current_semester = c.semester || c.current_semester || 1;
    c.capacity = c.capacity || 60;
    
    if (!c.status) {
      c.status = c.is_active === false ? 'ARCHIVED' : 'ACTIVE';
    }
    
    if (!c.created_by) {
      c.created_by = adminId;
    }
    
    await c.save({ validateBeforeSave: false });
  }

  console.log('Migration of Classes complete.');
  return { success: true, migrated: classes.length };
}

module.exports = { migrateClasses };
