const { validationResult } = require('express-validator');
const classRepo = require('../repositories/classRepo');
const studentRepo = require('../repositories/studentRepo');
const { success, error } = require('../utils/response');

exports.getClasses = async (req, res, next) => {
  try {
    const { department, batch_year, is_active = 'true' } = req.query;
    const filter = {};

    if (is_active !== 'all') filter.is_active = is_active === 'true';
    if (department) filter.department = department;
    if (batch_year) filter.batch_year = parseInt(batch_year);

    const classes = await classRepo.find(filter).sort({ department: 1, batch_year: 1, section: 1 });
    success(res, classes, { total: classes.length });
  } catch (err) {
    next(err);
  }
};

exports.createClass = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const { department, section, batch_year, graduation_year } = req.body;

    const existing = await classRepo.findOne({ department, section, batch_year });
    if (existing) {
      return error(res, `Class ${department}-${section}-${batch_year} already exists`, 409, 'CLASS_EXISTS');
    }

    const newClass = await classRepo.create({ 
      department, 
      section, 
      batch_year, 
      graduation_year,
      academic_year: 1,
      semester: 1 
    });
    success(res, newClass, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.getClassDetails = async (req, res, next) => {
  try {
    const classDoc = await classRepo.findById(req.params.id);
    if (!classDoc) {
      return error(res, 'Class not found', 404, 'NOT_FOUND');
    }

    const students = await studentRepo.findAll({ class_id: req.params.id })
      .select('full_name roll_number cgpa readiness_score readiness_tier section')
      .sort({ roll_number: 1 });

    success(res, { class: classDoc, students, total_students: students.length });
  } catch (err) {
    next(err);
  }
};

exports.updateClass = async (req, res, next) => {
  try {
    const classDoc = await classRepo.findById(req.params.id);
    if (!classDoc) {
      return error(res, 'Class not found', 404, 'NOT_FOUND');
    }

    const allowedFields = ['graduation_year', 'is_active', 'academic_year', 'semester'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    }

    const updated = await classRepo.updateById(req.params.id, updateData);
    success(res, updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteClass = async (req, res, next) => {
  try {
    const classDoc = await classRepo.findById(req.params.id);
    if (!classDoc) {
      return error(res, 'Class not found', 404, 'NOT_FOUND');
    }

    const updated = await classRepo.updateById(req.params.id, { is_active: false });
    success(res, { message: 'Class deactivated successfully', class: updated });
  } catch (err) {
    next(err);
  }
};
