/**
 * services/placementService.js
 * Placement business workflows.
 * Handles drive deletion cascade, application workflow, and shortlist assembly.
 */

const placementRepo = require('../repositories/placementRepo');
const studentRepo = require('../repositories/studentRepo');
const notificationRepo = require('../repositories/notificationRepo');
const { notifyDriveAnnounced } = require('./notification');
const { findEligibleStudents, checkStudentEligibility } = require('./eligibility');

/**
 * Create a placement drive and notify all eligible students.
 */
const createDrive = async (driveData, createdBy) => {
  const drive = await placementRepo.createDrive({
    created_by: createdBy,
    ...driveData
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

  return drive;
};

/**
 * Get drive details, optionally with student eligibility status.
 */
const getDriveById = async (driveId, userId, baseRole) => {
  const drive = await placementRepo.findDriveByIdWithPopulate(driveId);
  if (!drive) {
    const err = new Error('Placement drive not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  let eligibility_status = null;
  if (baseRole === 'student') {
    const student = await studentRepo.findByUserId(userId);
    if (student) {
      eligibility_status = await checkStudentEligibility(student, drive);
    }
  }

  return { drive, eligibility_status };
};

/**
 * Delete a drive and cascade: remove all associated applications and notifications.
 */
const deleteDrive = async (driveId) => {
  const drive = await placementRepo.findDriveById(driveId);
  if (!drive) {
    const err = new Error('Placement drive not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  await placementRepo.deleteDriveById(driveId);
  await placementRepo.deleteApplicationsByDrive(driveId);
  await notificationRepo.deleteByReferenceId(driveId);
};

/**
 * Get shortlist: eligible students + submitted applications for a drive.
 */
const getDriveShortlist = async (driveId) => {
  const drive = await placementRepo.findDriveById(driveId);
  if (!drive) {
    const err = new Error('Placement drive not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const eligibleStudents = await findEligibleStudents(drive);
  const applications = await placementRepo.findApplicationsByDriveWithPopulate(drive._id);

  return {
    eligible_students: eligibleStudents,
    applications,
    total_eligible: eligibleStudents.length,
    total_applied: applications.filter(a => a.status !== 'eligible').length
  };
};

/**
 * Apply a student to a placement drive.
 * Validates deadline, drive status, student eligibility, and duplicate applications.
 */
const applyToDrive = async (driveId, userId) => {
  const drive = await placementRepo.findDriveById(driveId);
  if (!drive) {
    const err = new Error('Placement drive not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (new Date() > new Date(drive.application_deadline)) {
    const err = new Error('Application deadline has passed');
    err.statusCode = 400;
    err.code = 'DEADLINE_PASSED';
    throw err;
  }

  if (drive.status === 'closed') {
    const err = new Error('This drive is closed');
    err.statusCode = 400;
    err.code = 'DRIVE_CLOSED';
    throw err;
  }

  const student = await studentRepo.findByUserId(userId);
  if (!student) {
    const err = new Error('Student profile not found');
    err.statusCode = 404;
    err.code = 'PROFILE_NOT_FOUND';
    throw err;
  }

  const eligibility = await checkStudentEligibility(student, drive);
  if (!eligibility.eligible) {
    const err = new Error(`Not eligible: ${eligibility.reasons.join(', ')}`);
    err.statusCode = 403;
    err.code = 'NOT_ELIGIBLE';
    throw err;
  }

  const existing = await placementRepo.findApplicationByStudentAndDrive(student._id, drive._id);
  if (existing) {
    const err = new Error('You have already applied for this drive');
    err.statusCode = 409;
    err.code = 'ALREADY_APPLIED';
    throw err;
  }

  return await placementRepo.createApplication({
    student_id: student._id,
    drive_id: drive._id,
    status: 'applied',
    applied_at: new Date()
  });
};

module.exports = { createDrive, getDriveById, deleteDrive, getDriveShortlist, applyToDrive };
