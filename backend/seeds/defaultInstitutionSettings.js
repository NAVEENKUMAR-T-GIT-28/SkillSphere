require('dotenv').config();
const mongoose = require('mongoose');
const InstitutionSettings = require('../models/InstitutionSettings');

const seedSettings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await InstitutionSettings.findOne({});
    if (existing) {
      console.log('InstitutionSettings already exist. No action taken.');
      process.exit(0);
    }

    const defaultSettings = new InstitutionSettings({
      login_strategy: 'ROLL_NUMBER',
      mentor_capacity: 20,
      grading_scale: 10,
      password_policy: {
        min_length: 12,
        require_special: true
      }
    });

    await defaultSettings.save();
    console.log('Default InstitutionSettings successfully seeded.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding settings:', error);
    process.exit(1);
  }
};

seedSettings();
