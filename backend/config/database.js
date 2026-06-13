// config/database.js
// Mongoose connection. Call connectDB() once from server.js.

const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    if (NODE_ENV !== 'test') {
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    }
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
