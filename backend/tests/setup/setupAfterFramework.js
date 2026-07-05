const mongoose = require('mongoose');

// Default to a local test database if env var is not set
const TEST_DB_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/skillsphere_test';

// Clear all collections at the start of each test file to prevent test file cross-contamination
// while allowing sequential steps within a test file to persist state.
// Suppress expected console.error from errorHandler during tests
beforeAll(async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});

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
  // Fire-and-forget syncStudentSearch calls (readinessScore.js, verification.js,
  // resumeController.js) may still be in flight when a test finishes — give them
  // a brief grace period so they don't log a spurious MongoClientClosedError
  // when we disconnect below.
  await new Promise((resolve) => setImmediate(resolve));

  if (console.error.mockRestore) {
    console.error.mockRestore();
  }
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
});