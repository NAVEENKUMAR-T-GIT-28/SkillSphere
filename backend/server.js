/**
 * SkillSphere Backend — Express Server Entry Point
 * 
 * Stack: Node.js + Express + MongoDB (Mongoose)
 * Auth: JWT + bcrypt
 * 
 * Run: npm run dev (development with nodemon)
 * Run: npm start (production)
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Middleware
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const skillRoutes = require('./routes/skills');
const certificationRoutes = require('./routes/certifications');
const projectRoutes = require('./routes/projects');
const resumeRoutes = require('./routes/resumes');
const codingProfileRoutes = require('./routes/codingProfiles');
const facultyRoutes = require('./routes/faculty');
const searchRoutes = require('./routes/search');
const placementRoutes = require('./routes/placement');
const hodRoutes = require('./routes/hod');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Global Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', skillRoutes);                        // /api/skill-taxonomy + /api/students/:id/skills
app.use('/api/students', certificationRoutes);       // /api/students/:id/certifications
app.use('/api', projectRoutes);                      // /api/students/:id/projects + /api/projects/:id/rate
app.use('/api/students', resumeRoutes);              // /api/students/:id/resumes
app.use('/api/students', codingProfileRoutes);       // /api/students/:id/coding-profiles
app.use('/api/verification', facultyRoutes);         // /api/verification/queue + approve/reject
app.use('/api/search', searchRoutes);                // /api/search/students
app.use('/api', placementRoutes);                     // /api/placement-drives/* + /api/applications/*
app.use('/api/hod', hodRoutes);                      // /api/hod/*
app.use('/api/notifications', notificationRoutes);   // /api/notifications

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: 'ROUTE_NOT_FOUND' }
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use(errorHandler);

// ─── MongoDB Connection + Server Start ──────────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 SkillSphere backend running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
});

module.exports = app;
