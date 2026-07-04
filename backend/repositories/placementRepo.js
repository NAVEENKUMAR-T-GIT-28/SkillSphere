// repositories/placementRepo.js
const PlacementDrive = require('../models/PlacementDrive');
const Application = require('../models/Application');

// ── Drives ─────────────────────────────────────────────────────────────────────
const findMany = (filter = {}, skip = 0, limit = 20) => PlacementDrive.find(filter).populate('created_by', 'email').sort({ drive_date: -1 }).skip(skip).limit(limit);
const findById = (id) => PlacementDrive.findById(id);
const create = (data) => PlacementDrive.create(data);
const updateById = (id, data) => PlacementDrive.findByIdAndUpdate(id, data, { new: true, runValidators: true });
const deleteById = (id) => PlacementDrive.findByIdAndDelete(id);
const count = (filter = {}) => PlacementDrive.countDocuments(filter);

const findAllDrives = findMany;
const findDriveById = findById;
const findDriveByIdWithPopulate = (id) => PlacementDrive.findById(id).populate('created_by', 'email');
const createDrive = create;
const updateDriveById = updateById;
const deleteDriveById = deleteById;
const countDrives = count;

// ── Applications ───────────────────────────────────────────────────────────────
const findManyApplications = (filter) => Application.find(filter).populate('drive_id').sort({ applied_at: -1 });
const createApplication = (data) => Application.create(data);
const updateApplication = (id, data) => Application.findByIdAndUpdate(id, data, { new: true });
const countApplications = (filter = {}) => Application.countDocuments(filter);

const findApplicationsByDrive = (driveId) => Application.find({ drive_id: driveId });
const findApplicationsByDriveWithPopulate = (driveId) => Application.find({ drive_id: driveId }).populate('student_id', 'full_name roll_number department cgpa readiness_score readiness_tier');
const findApplications = findManyApplications;
const findApplicationByStudentAndDrive = (studentId, driveId) => Application.findOne({ student_id: studentId, drive_id: driveId });
const updateApplicationStatus = (id, status) => updateApplication(id, { status });
const findApplicationById = (id) => Application.findById(id);
const deleteApplicationsByDrive = (driveId) => Application.deleteMany({ drive_id: driveId });

module.exports = {
  findMany, findById, create, updateById, deleteById, count, countDocuments: count,
  findAllDrives, findDriveById, findDriveByIdWithPopulate, createDrive, updateDriveById, deleteDriveById, countDrives,
  findApplicationsByDrive, findApplicationsByDriveWithPopulate, findApplications, findApplicationByStudentAndDrive,
  createApplication, updateApplicationStatus, updateApplication, findApplicationById, countApplications, deleteApplicationsByDrive
};
