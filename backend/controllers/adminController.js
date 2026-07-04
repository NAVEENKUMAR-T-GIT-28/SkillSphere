// controllers/adminController.js
const { validationResult } = require('express-validator');
const { createHod } = require('../services/admin');
const { success, error } = require('../utils/response');

exports.createHod = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const result = await createHod(req.body);
    success(res, result, {}, 201);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code);
    }
    next(err);
  }
};
