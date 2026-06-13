// config/env.js
// Centralised, validated environment variables.
// Import this instead of using process.env directly.

require('dotenv').config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

module.exports = {
  NODE_ENV:       process.env.NODE_ENV || 'development',
  PORT:           parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI:    required('MONGODB_URI'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:5173'
};
