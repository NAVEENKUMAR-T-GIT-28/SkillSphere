/**
 * SkillSphere Backend — Express Server Entry Point
 * 
 * Stack: Node.js + Express + MongoDB (Mongoose)
 * Auth: JWT + bcrypt
 * 
 * Run: npm run dev (development with nodemon)
 * Run: npm start (production)
 */

const express = require('express');
const cors = require('cors');
const { PORT, ALLOWED_ORIGINS, NODE_ENV } = require('./config/env');
const connectDB = require('./config/database');
const mongoose = require('mongoose');
const { printStartupSummary } = require('./utils/startupLogger');


// Middleware
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const skillRoutes = require('./routes/skills');
const certificationRoutes = require('./routes/certifications');
const projectRoutes = require('./routes/projects');
const internshipRoutes = require('./routes/internships');
const achievementRoutes = require('./routes/achievements');
const resumeRoutes = require('./routes/resumes');
const codingProfileRoutes = require('./routes/codingProfile.routes');
const facultyRoutes = require('./routes/faculty');
const searchV2Routes = require('./routes/searchV2');
const placementRoutes = require('./routes/placement');
const hodRoutes = require('./routes/hod');
const notificationRoutes = require('./routes/notifications');
const myAccessRoutes = require('./routes/myAccess');
const adminRoutes = require('./routes/admin');
const classRoutes = require('./routes/classes');

const v1ProfileRoutes = require('./routes/profile.routes');
const bootstrapEvents = require('./services/events/bootstrap');

const app = express();

// Initialize the event synchronization backbone
bootstrapEvents();

// ─── Global Middleware ──────────────────────────────────────────────────────
const allowedOrigins = ALLOWED_ORIGINS
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (NODE_ENV === 'development') {
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
      environment: NODE_ENV || 'development'
    }
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', skillRoutes);                        // /api/skill-taxonomy + /api/students/:id/skills
app.use('/api/students', certificationRoutes);       // /api/students/:id/certifications
app.use('/api', projectRoutes);                      // /api/students/:id/projects + /api/projects/:id/rate
app.use('/api/students', internshipRoutes);           // /api/students/:id/internships
app.use('/api/students', achievementRoutes);          // /api/students/:id/achievements
app.use('/api/students', resumeRoutes);              // /api/students/:id/resumes
app.use('/api/students', codingProfileRoutes);       // /api/students/:id/coding-profile
app.use('/api/verification', facultyRoutes);         // /api/verification/queue + approve/reject
app.use('/api/search/v2', searchV2Routes);           // /api/search/v2/students (additive, validation only)
app.use('/api', placementRoutes);                     // /api/placement-drives/* + /api/applications/*
app.use('/api/hod', hodRoutes);                      // /api/hod/*
app.use('/api/notifications', notificationRoutes);   // /api/notifications
app.use('/api/my', myAccessRoutes);                  // /api/my/*
app.use('/api/admin', adminRoutes);                  // /api/admin/*
app.use('/api/classes', classRoutes);                // /api/classes/*
app.use('/api', require('./ats'));                    // /api/students/:id/resumes/ats etc

// ─── API v1 Routes ──────────────────────────────────────────────────────────
app.use('/api/v1/student/profile', v1ProfileRoutes);

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
if (NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      printStartupSummary(app, { NODE_ENV, PORT, ORIGIN: ALLOWED_ORIGINS }, mongoose);
    });
  });
}

module.exports = app;
