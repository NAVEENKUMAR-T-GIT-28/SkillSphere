// controllers/placementController.js
const { validationResult } = require('express-validator');
const placementRepo = require('../repositories/placementRepo');
const {
  createDrive, getDriveById, deleteDrive, getDriveShortlist, applyToDrive
} = require('../services/placementService');
const { success, error } = require('../utils/response');
const { paginate, buildMeta } = require('../utils/pagination');

exports.getAllDrives = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const { skip, limit: parsedLimit, page: parsedPage } = paginate(page, limit);
    const total = await placementRepo.countDrives(filter);
    const drives = await placementRepo.findAllDrives(filter, skip, parsedLimit);

    success(res, drives, buildMeta(total, parsedPage, parsedLimit));
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

    const drive = await createDrive(req.body, req.user.userId);
    success(res, drive, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.getDriveById = async (req, res, next) => {
  try {
    const result = await getDriveById(req.params.id, req.user.userId, req.user.baseRole);
    success(res, result);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code);
    }
    next(err);
  }
};

exports.deleteDrive = async (req, res, next) => {
  try {
    await deleteDrive(req.params.id);
    success(res, { message: 'Placement drive deleted successfully' });
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code);
    }
    next(err);
  }
};

exports.getDriveShortlist = async (req, res, next) => {
  try {
    const result = await getDriveShortlist(req.params.id);
    success(res, result);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code);
    }
    next(err);
  }
};

exports.applyToDrive = async (req, res, next) => {
  try {
    const application = await applyToDrive(req.params.id, req.user.userId);
    success(res, application, {}, 201);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code);
    }
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

    application = await placementRepo.updateApplication(req.params.id, {
      status: req.body.status,
      last_status_update: new Date(),
      ...(req.body.notes && { notes: req.body.notes })
    });

    success(res, application);
  } catch (err) {
    next(err);
  }
};
