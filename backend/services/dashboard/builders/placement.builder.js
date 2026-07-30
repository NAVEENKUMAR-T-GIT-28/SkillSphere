/**
 * Placement Builder
 * Finds upcoming placement drives.
 */
const PlacementDrive = require('../../../models/PlacementDrive');
const Application = require('../../../models/Application');

async function buildPlacements(searchDoc, studentId) {
  const p = searchDoc.placement || {};
  const now = new Date();
  
  // Find upcoming drives (Legacy Query kept because upcoming drives are not in StudentSearch)
  const upcomingDrives = await PlacementDrive.find({ application_deadline: { $gt: now } })
    .sort({ application_deadline: 1 })
    .limit(5)
    .lean();

  let upcoming = [];
  
  if (upcomingDrives.length > 0) {
    const driveIds = upcomingDrives.map(d => d._id);

    // Check if student has applied to any of these (Legacy Query kept because application lists are not in StudentSearch)
    const applications = await Application.find({
      student_id: studentId,
      drive_id: { $in: driveIds }
    }).lean();

    const appliedDriveIds = new Set(applications.map(a => a.drive_id.toString()));

    upcoming = upcomingDrives.map(drive => ({
      id: drive._id.toString(),
      company: drive.company_name,
      role: drive.role_title,
      package: drive.ctc || 'Not Disclosed',
      deadline: drive.application_deadline,
      eligible: true, // Requires evaluating drive eligibility rules, default to true for dashboard
      applied: appliedDriveIds.has(drive._id.toString())
    }));
  }

  return {
    eligible: p.eligible || false,
    applied_count: p.applied || 0,
    placed: p.placed || false,
    upcoming
  };
}

module.exports = { buildPlacements };
