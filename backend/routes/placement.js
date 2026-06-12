/**
 * Placement Routes
 * GET    /api/placement-drives                      — List drives
 * POST   /api/placement-drives                      — Create drive (HOD only)
 * GET    /api/placement-drives/:id                   — Get drive details
 * GET    /api/placement-drives/:id/shortlist         — Get eligible/shortlisted students
 * POST   /api/placement-drives/:id/apply             — Student applies
 * PATCH  /api/applications/:id/status                — Update application status
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const PlacementDrive = require('../models/PlacementDrive');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Skill = require('../models/Skill');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');
const { notifyDriveAnnounced } = require('../services/notification');
const { success, error } = require('../utils/response');

const router = express.Router();

/**
 * GET /api/placement-drives
 * List all placement drives. Supports status filter.
 */
router.get(
  '/placement-drives',
  authenticate,
  async (req, res, next) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const filter = {};
      if (status) filter.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const total = await PlacementDrive.countDocuments(filter);

      const drives = await PlacementDrive.find(filter)
        .populate('created_by', 'email')
        .sort({ drive_date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      success(res, drives, {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/placement-drives
 * Create a new placement drive. HOD only.
 */
router.post(
  '/placement-drives',
  authenticate,
  requireRole('hod'),
  [
    body('company_name').notEmpty().trim().withMessage('Company name is required'),
    body('role_title').notEmpty().trim().withMessage('Role title is required'),
    body('drive_date').isISO8601().withMessage('Valid drive date is required'),
    body('application_deadline').isISO8601().withMessage('Valid application deadline is required'),
    body('drive_type')
      .isIn(['oncampus', 'offcampus', 'internship'])
      .withMessage('Drive type must be oncampus, offcampus, or internship'),
    body('eligibility').optional().isObject()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const drive = await PlacementDrive.create({
        created_by: req.user.userId,
        ...req.body
      });

      // Notify eligible students
      try {
        const eligibleStudents = await findEligibleStudents(drive);
        const userIds = [];
        for (const s of eligibleStudents) {
          userIds.push(s.user_id);
        }
        if (userIds.length > 0) {
          await notifyDriveAnnounced(userIds, drive.company_name, drive.role_title, drive._id);
        }
      } catch (notifyErr) {
        console.error('Failed to send drive notifications:', notifyErr.message);
      }

      success(res, drive, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/placement-drives/:id
 * Get drive details.
 */
router.get(
  '/placement-drives/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const drive = await PlacementDrive.findById(req.params.id)
        .populate('created_by', 'email');

      if (!drive) {
        return error(res, 'Placement drive not found', 404, 'NOT_FOUND');
      }

      // If student, check eligibility
      let eligibility_status = null;
      if (req.user.baseRole === 'student') {
        const student = await Student.findOne({ user_id: req.user.userId });
        if (student) {
          eligibility_status = await checkStudentEligibility(student, drive);
        }
      }

      success(res, { drive, eligibility_status });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/placement-drives/:id
 * Delete a placement drive. HOD only.
 */
router.delete(
  '/placement-drives/:id',
  authenticate,
  requireRole('hod'),
  async (req, res, next) => {
    try {
      const drive = await PlacementDrive.findById(req.params.id);
      if (!drive) {
        return error(res, 'Placement drive not found', 404, 'NOT_FOUND');
      }

      await drive.deleteOne();
      // Optionally cascade delete applications for this drive
      await Application.deleteMany({ drive_id: req.params.id });

      success(res, { message: 'Placement drive deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/placement-drives/:id/shortlist
 * Get eligible/shortlisted students for a drive. Faculty/HOD only.
 */
router.get(
  '/placement-drives/:id/shortlist',
  authenticate,
  requireRole('faculty', 'hod'),
  async (req, res, next) => {
    try {
      const drive = await PlacementDrive.findById(req.params.id);
      if (!drive) {
        return error(res, 'Placement drive not found', 404, 'NOT_FOUND');
      }

      // Get eligible students
      const eligibleStudents = await findEligibleStudents(drive);

      // Get existing applications
      const applications = await Application.find({ drive_id: drive._id })
        .populate('student_id', 'full_name roll_number department cgpa readiness_score readiness_tier');

      success(res, {
        eligible_students: eligibleStudents,
        applications,
        total_eligible: eligibleStudents.length,
        total_applied: applications.filter(a => a.status !== 'eligible').length
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/placement-drives/:id/apply
 * Student applies for a drive.
 */
router.post(
  '/placement-drives/:id/apply',
  authenticate,
  requireRole('student'),
  async (req, res, next) => {
    try {
      const drive = await PlacementDrive.findById(req.params.id);
      if (!drive) {
        return error(res, 'Placement drive not found', 404, 'NOT_FOUND');
      }

      // Check deadline
      if (new Date() > new Date(drive.application_deadline)) {
        return error(res, 'Application deadline has passed', 400, 'DEADLINE_PASSED');
      }

      // Check drive status
      if (drive.status === 'closed') {
        return error(res, 'This drive is closed', 400, 'DRIVE_CLOSED');
      }

      // Find student profile
      const student = await Student.findOne({ user_id: req.user.userId });
      if (!student) {
        return error(res, 'Student profile not found', 404, 'PROFILE_NOT_FOUND');
      }

      // Check eligibility
      const eligibility = await checkStudentEligibility(student, drive);
      if (!eligibility.eligible) {
        return error(res, `Not eligible: ${eligibility.reasons.join(', ')}`, 403, 'NOT_ELIGIBLE');
      }

      // Check for existing application
      const existing = await Application.findOne({
        student_id: student._id,
        drive_id: drive._id
      });
      if (existing) {
        return error(res, 'You have already applied for this drive', 409, 'ALREADY_APPLIED');
      }

      // Create application
      const application = await Application.create({
        student_id: student._id,
        drive_id: drive._id,
        status: 'applied',
        applied_at: new Date()
      });

      success(res, application, {}, 201);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/applications/:id/status
 * Update application status. HOD or faculty only.
 */
router.patch(
  '/applications/:id/status',
  authenticate,
  requireRole('faculty', 'hod'),
  [
    body('status')
      .isIn(['shortlisted', 'round1', 'round2', 'selected', 'rejected'])
      .withMessage('Invalid status'),
    body('notes').optional().trim()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
      }

      const application = await Application.findById(req.params.id);
      if (!application) {
        return error(res, 'Application not found', 404, 'NOT_FOUND');
      }

      application.status = req.body.status;
      application.last_status_update = new Date();
      if (req.body.notes) application.notes = req.body.notes;

      await application.save();

      success(res, application);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Find all students eligible for a placement drive.
 */
async function findEligibleStudents(drive) {
  const filter = {};
  const elig = drive.eligibility || {};

  if (elig.min_cgpa) filter.cgpa = { $gte: elig.min_cgpa };
  if (elig.batch_years && elig.batch_years.length) filter.batch_year = { $in: elig.batch_years };
  if (elig.departments && elig.departments.length) filter.department = { $in: elig.departments };
  if (elig.sections && elig.sections.length) filter.section = { $in: elig.sections };
  if (elig.min_readiness_score) filter.readiness_score = { $gte: elig.min_readiness_score };

  let students = await Student.find(filter)
    .select('full_name roll_number department cgpa readiness_score readiness_tier user_id batch_year section')
    .sort({ readiness_score: -1 });

  // Filter by required skills (verified) — AND logic
  if (elig.required_skills && elig.required_skills.length > 0) {
    const studentIds = students.map(s => s._id);
    const matches = await Skill.aggregate([
      { $match: {
          student_id: { $in: studentIds },
          status: 'verified',
          skill_name: { $in: elig.required_skills }
      }},
      { $group: { _id: '$student_id', count: { $sum: 1 } } },
      { $match: { count: { $gte: elig.required_skills.length } } }
    ]);
    const eligibleIds = new Set(matches.map(m => m._id.toString()));
    students = students.filter(s => eligibleIds.has(s._id.toString()));
  }

  return students;
}

/**
 * Check if a specific student is eligible for a drive.
 */
async function checkStudentEligibility(student, drive) {
  const reasons = [];
  const elig = drive.eligibility || {};

  if (elig.min_cgpa && student.cgpa < elig.min_cgpa) {
    reasons.push(`CGPA ${student.cgpa} < required ${elig.min_cgpa}`);
  }
  if (elig.batch_years && elig.batch_years.length && !elig.batch_years.includes(student.batch_year)) {
    reasons.push(`Batch year ${student.batch_year} not in ${elig.batch_years.join(', ')}`);
  }
  if (elig.departments && elig.departments.length && !elig.departments.includes(student.department)) {
    reasons.push(`Department ${student.department} not eligible`);
  }
  if (elig.sections && elig.sections.length && !elig.sections.includes(student.section)) {
    reasons.push(`Section ${student.section} not eligible`);
  }
  if (elig.min_readiness_score && student.readiness_score < elig.min_readiness_score) {
    reasons.push(`Readiness score ${student.readiness_score} < required ${elig.min_readiness_score}`);
  }

  // Check required skills
  if (elig.required_skills && elig.required_skills.length > 0) {
    const verifiedSkills = await Skill.find({
      student_id: student._id,
      status: 'verified',
      skill_name: { $in: elig.required_skills }
    });
    const missingSkills = elig.required_skills.filter(
      s => !verifiedSkills.some(vs => vs.skill_name === s)
    );
    if (missingSkills.length > 0) {
      reasons.push(`Missing verified skills: ${missingSkills.join(', ')}`);
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

module.exports = router;
