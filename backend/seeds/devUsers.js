/**
 * Dev Users Seed Script
 * Run: node seeds/devUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

const seedUsers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Define seed users and profiles details
    const defaultPassword = 'Password123';
    const emailSuffix = '@skillsphere.dev';

    const usersData = [
      { email: 'admin' + emailSuffix, base_role: 'admin' },
      { email: 'student' + emailSuffix, base_role: 'student' },
      { email: 'faculty' + emailSuffix, base_role: 'faculty' },
      { email: 'hod' + emailSuffix, base_role: 'hod' }
    ];

    // Clean up existing seeded users
    const emailsToClean = usersData.map(u => u.email);
    const existingUsers = await User.find({ email: { $in: emailsToClean } });
    const existingUserIds = existingUsers.map(u => u._id);

    if (existingUserIds.length > 0) {
      console.log('Cleaning up existing seed users and profiles...');
      await User.deleteMany({ _id: { $in: existingUserIds } });
      await Student.deleteMany({ user_id: { $in: existingUserIds } });
      await Faculty.deleteMany({ user_id: { $in: existingUserIds } });
    }

    console.log('Seeding new users...');

    // 1. Admin
    const adminUser = await User.create({
      email: 'admin' + emailSuffix,
      password: defaultPassword,
      base_role: 'admin'
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);

    // 2. Student
    const studentUser = await User.create({
      email: 'student' + emailSuffix,
      password: defaultPassword,
      base_role: 'student'
    });
    const Class = require('../models/Class');
    let devClass = await Class.findOne({ department: 'Computer Science', section: 'A', batch_year: 2023 });
    if (!devClass) {
      devClass = await Class.create({
        department: 'Computer Science',
        section: 'A',
        batch_year: 2023,
        graduation_year: 2027,
        academic_year: 3,
        semester: 6
      });
    }

    const studentProfile = await Student.create({
      user_id: studentUser._id,
      class_id: devClass._id,
      full_name: 'John Doe (Student)',
      roll_number: 'STU1001',
      department: 'Computer Science',
      batch_year: 2023,
      graduation_year: 2027,
      section: 'A',
      semester: 6,
      cgpa: 8.5
    });
    console.log(`✅ Student user created: ${studentUser.email} (Roll: ${studentProfile.roll_number})`);

    // 3. Faculty
    const facultyUser = await User.create({
      email: 'faculty' + emailSuffix,
      password: defaultPassword,
      base_role: 'faculty'
    });
    const facultyProfile = await Faculty.create({
      user_id: facultyUser._id,
      full_name: 'Dr. Jane Smith',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      employee_id: 'FAC2001',
      phone: '9876543210'
    });
    console.log(`✅ Faculty user created: ${facultyUser.email} (EmpID: ${facultyProfile.employee_id})`);

    // 4. HOD
    const hodUser = await User.create({
      email: 'hod' + emailSuffix,
      password: defaultPassword,
      base_role: 'hod'
    });
    const hodProfile = await Faculty.create({
      user_id: hodUser._id,
      full_name: 'Dr. Robert Brown (HOD)',
      department: 'Computer Science',
      designation: 'Professor & Head',
      employee_id: 'FAC2002',
      phone: '9876543211'
    });
    console.log(`✅ HOD user created: ${hodUser.email} (EmpID: ${hodProfile.employee_id})`);

    console.log('\n===============================================');
    console.log('🎉 Seeding successfully completed!');
    console.log('===============================================');
    console.log('You can log in with the following credentials:\n');
    console.log(`🔑 Admin:   Email: ${adminUser.email}   Password: ${defaultPassword}`);
    console.log(`🔑 Student: Email: ${studentUser.email} Password: ${defaultPassword}`);
    console.log(`🔑 Faculty: Email: ${facultyUser.email} Password: ${defaultPassword}`);
    console.log(`🔑 HOD:     Email: ${hodUser.email}     Password: ${defaultPassword}`);
    console.log('===============================================\n');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
};

seedUsers();
