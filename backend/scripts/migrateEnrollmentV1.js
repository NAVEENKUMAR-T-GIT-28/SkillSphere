require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const InstitutionSettings = require('../models/InstitutionSettings');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure InstitutionSettings exist
    let settings = await InstitutionSettings.findOne({});
    if (!settings) {
      settings = await InstitutionSettings.create({
        login_strategy: 'ROLL_NUMBER',
        password_policy: { min_length: 12, require_special: true }
      });
      console.log('Created default InstitutionSettings');
    }

    // 2. Migrate Users
    const users = await User.find({ login_identifier: { $exists: false } });
    console.log(`Found ${users.length} users to migrate.`);
    
    for (const user of users) {
      // Find the associated student to get the roll number if needed
      const student = await Student.findOne({ user_id: user._id });
      
      // Use email prefix or roll number as the login identifier
      if (student && student.roll_number) {
        user.login_identifier = student.roll_number;
      } else {
        user.login_identifier = user.email.split('@')[0];
      }
      
      if (!user.account_status) user.account_status = 'ACTIVE';
      if (user.must_change_password === undefined) user.must_change_password = false;
      
      await user.save();
    }

    // 3. Migrate Students
    const students = await Student.find({ academic_status: { $exists: false } });
    console.log(`Found ${students.length} students to migrate.`);
    
    for (const student of students) {
      student.academic_status = 'ENROLLED';
      student.latest_cgpa = student.cgpa || 0;
      student.active_backlogs = student.current_backlogs || 0;
      await student.save();
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
