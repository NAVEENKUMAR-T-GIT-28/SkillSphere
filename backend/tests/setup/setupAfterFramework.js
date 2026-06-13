const mongoose = require('mongoose');

// Default to a local test database if env var is not set
const TEST_DB_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/skillsphere_test';

// Clear all collections at the start of each test file to prevent test file cross-contamination
// while allowing sequential steps within a test file to persist state.
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  if (mongoose.connection.readyState === 1) {
    const collections = Object.values(mongoose.connection.collections);
    for (const col of collections) {
      await col.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
});
