// controllers/placementController.js
const { validationResult } = require('express-validator');
const placementRepo = require('../repositories/placementRepo');
const studentRepo = require('../repositories/studentRepo');
const { notifyDriveAnnounced } = require('../services/notification');
const { findEligibleStudents, checkStudentEligibility } = require('../services/eligibility');
const { success, error } = require('../utils/response');

exports.getAllDrives = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await placementRepo.countDrives(filter);
    
    // findDrives populate created_by internally? Let's just do it directly or use repo.
    // Repo findAllDrives doesn't populate right now. I will just rely on the controller logic.
    // Wait, let's just require PlacementDrive model to populate. Or add populate to Repo.
    const PlacementDrive = require('../models/PlacementDrive');
    const drives = await PlacementDrive.find(filter)
      .populate('created_by', 'email')
      .sort({ drive_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    success(res, drives, {
      total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    next(err);
  }
};

exports.createDrive = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const drive = await placementRepo.createDrive({
      created_by: req.user.userId,
      ...req.body
    });

    try {
      const eligibleStudents = await findEligibleStudents(drive);
      const userIds = eligibleStudents.map(s => s.user_id);
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
};

exports.getDriveById = async (req, res, next) => {
  try {
    const PlacementDrive = require('../models/PlacementDrive');
    const drive = await PlacementDrive.findById(req.params.id).populate('created_by', 'email');
    if (!drive) {
      return error(res, 'Placement drive not found', 404, 'NOT_FOUND');
    }

    let eligibility_status = null;
    if (req.user.baseRole === 'student') {
      const student = await studentRepo.findByUserId(req.user.userId);
      if (student) {
        eligibility_status = await checkStudentEligibility(student, drive);
      }
    }

    success(res, { drive, eligibility_status });
  } catch (err) {
    next(err);
  }
};

exports.deleteDrive = async (req, res, next) => {
  try {
    const drive = await placementRepo.findDriveById(req.params.id);
    if (!drive) {
      return error(res, 'Placement drive not found', 404, 'NOT_FOUND');
    }

    await placementRepo.deleteDriveById(req.params.id);
    await placementRepo.deleteApplicationsByDrive(req.params.id);
    const notificationRepo = require('../repositories/notificationRepo');
    await notificationRepo.deleteByReferenceId(req.params.id);

    success(res, { message: 'Placement drive deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getDriveShortlist = async (req, res, next) => {
  try {
    const drive = await placementRepo.findDriveById(req.params.id);
    if (!drive) {
      return error(res, 'Placement drive not found', 404, 'NOT_FOUND');
    }

    const eligibleStudents = await findEligibleStudents(drive);
    const Application = require('../models/Application');
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
};

exports.applyToDrive = async (req, res, next) => {
  try {
    const drive = await placementRepo.findDriveById(req.params.id);
    if (!drive) {
      return error(res, 'Placement drive not found', 404, 'NOT_FOUND');
    }

    if (new Date() > new Date(drive.application_deadline)) {
      return error(res, 'Application deadline has passed', 400, 'DEADLINE_PASSED');
    }

    if (drive.status === 'closed') {
      return error(res, 'This drive is closed', 400, 'DRIVE_CLOSED');
    }

    const student = await studentRepo.findByUserId(req.user.userId);
    if (!student) {
      return error(res, 'Student profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    const eligibility = await checkStudentEligibility(student, drive);
    if (!eligibility.eligible) {
      return error(res, `Not eligible: ${eligibility.reasons.join(', ')}`, 403, 'NOT_ELIGIBLE');
    }

    const existing = await placementRepo.findApplicationByStudentAndDrive(student._id, drive._id);
    if (existing) {
      return error(res, 'You have already applied for this drive', 409, 'ALREADY_APPLIED');
    }

    const application = await placementRepo.createApplication({
      student_id: student._id, drive_id: drive._id, status: 'applied', applied_at: new Date()
    });

    success(res, application, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    let application = await placementRepo.findApplicationById(req.params.id);
    if (!application) {
      return error(res, 'Application not found', 404, 'NOT_FOUND');
    }

    const Application = require('../models/Application');
    application = await Application.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
      last_status_update: new Date(),
      ...(req.body.notes && { notes: req.body.notes })
    }, { new: true });

    success(res, application);
  } catch (err) {
    next(err);
  }
};
