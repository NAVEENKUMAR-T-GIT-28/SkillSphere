// repositories/placementRepo.js
const PlacementDrive = require('../models/PlacementDrive');
const Application = require('../models/Application');

// ── Drives ─────────────────────────────────────────────────────────────────────
const findAllDrives = (filter = {}, skip = 0, limit = 20) => PlacementDrive.find(filter).sort({ drive_date: -1 }).skip(skip).limit(limit);
const findDriveById = (id) => PlacementDrive.findById(id);
const createDrive = (data) => PlacementDrive.create(data);
const updateDriveById = (id, data) => PlacementDrive.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteDriveById = (id) => PlacementDrive.findByIdAndDelete(id);
const countDrives = (filter = {}) => PlacementDrive.countDocuments(filter);

// ── Applications ───────────────────────────────────────────────────────────────
const findApplicationsByDrive = (driveId) => Application.find({ drive_id: driveId });
const findApplications = (filter) => Application.find(filter).populate('drive_id').sort({ applied_at: -1 });
const findApplicationByStudentAndDrive = (studentId, driveId) => Application.findOne({ student_id: studentId, drive_id: driveId });
const createApplication = (data) => Application.create(data);
const updateApplicationStatus = (id, status) => Application.findByIdAndUpdate(id, { status }, { new: true });
const findApplicationById = (id) => Application.findById(id);
const countApplications = (filter = {}) => Application.countDocuments(filter);
const deleteApplicationsByDrive = (driveId) => Application.deleteMany({ drive_id: driveId });

module.exports = {
  findAllDrives, findDriveById, createDrive, updateDriveById, deleteDriveById, countDrives,
  findApplicationsByDrive, findApplications, findApplicationByStudentAndDrive,
  createApplication, updateApplicationStatus, findApplicationById, countApplications, deleteApplicationsByDrive
};
