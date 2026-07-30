const { validationResult } = require('express-validator');
const classRepo = require('../repositories/classRepo');
const studentRepo = require('../repositories/studentRepo');
const facultyRepo = require('../repositories/facultyRepo');
const { success, error } = require('../utils/response');
const eventPublisher = require('../services/events/eventPublisher');

exports.getClasses = async (req, res, next) => {
  try {
    const { department, batch_start, status = 'ACTIVE' } = req.query;
    const filter = {};

    if (status !== 'all') filter.status = status;
    if (department) filter.department = department;
    if (batch_start) filter.batch_start = parseInt(batch_start);

    // If HOD, limit to their department
    if (req.user.role === 'hod') {
      const faculty = await facultyRepo.findByUserId(req.user.userId);
      if (faculty && faculty.department) {
        filter.department = faculty.department;
      }
    }

    const classes = await classRepo.findMany(filter)
      .populate('advisor_id', 'full_name')
      .sort({ department: 1, batch_start: 1, section: 1 });
      
    const formattedClasses = classes.map(c => ({
      _id: c._id,
      department: c.department,
      section: c.section,
      batch_start: c.batch_start,
      batch_end: c.batch_end,
      current_year: c.current_year,
      current_semester: c.current_semester,
      capacity: c.capacity,
      advisor: c.advisor_id,
      status: c.status,
      label: c.label,
      display_name: c.display_name
    }));

    success(res, formattedClasses, { total: formattedClasses.length });
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

    const { department, section, batch_start, batch_end, current_year, current_semester, advisor_id, capacity } = req.body;
    let dept = department;

    // Force department to HOD's department
    if (req.user.role === 'hod') {
      const faculty = await facultyRepo.findByUserId(req.user.userId);
      if (!faculty) return error(res, 'Faculty profile not found', 404, 'NOT_FOUND');
      dept = faculty.department;
    }

    const existing = await classRepo.findOne({ department: dept, section, batch_start });
    if (existing) {
      return error(res, `Class ${dept}-${section}-${batch_start} already exists`, 409, 'CLASS_EXISTS');
    }

    const newClass = await classRepo.create({ 
      department: dept, 
      section, 
      batch_start, 
      batch_end: batch_end || (batch_start + 4),
      current_year: current_year || 1,
      current_semester: current_semester || 1,
      advisor_id: advisor_id || null,
      capacity: capacity || 60,
      status: 'ACTIVE',
      created_by: req.user.userId
    });
    
    eventPublisher.publish('ClassCreated', {
      classId: newClass._id,
      department: newClass.department,
      section: newClass.section,
      batchStart: newClass.batch_start
    });
    
    success(res, newClass, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.getClassDetails = async (req, res, next) => {
  try {
    const classDoc = await classRepo.findById(req.params.id).populate('advisor_id', 'full_name');
    if (!classDoc) {
      return error(res, 'Class not found', 404, 'NOT_FOUND');
    }

    const students = await studentRepo.findMany({ class_id: req.params.id })
      .select('full_name roll_number user_id account_status academic_status')
      .populate('user_id', 'account_status email')
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

    const allowedFields = ['batch_start', 'batch_end', 'current_year', 'current_semester', 'advisor_id', 'capacity', 'status'];
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

    const updated = await classRepo.updateById(req.params.id, { status: 'ARCHIVED' });
    
    eventPublisher.publish('ClassArchived', {
      classId: updated._id
    });
    
    success(res, { message: 'Class archived successfully', class: updated });
  } catch (err) {
    next(err);
  }
};

exports.promoteClass = async (req, res, next) => {
  try {
    const classDoc = await classRepo.findById(req.params.id);
    if (!classDoc) {
      return error(res, 'Class not found', 404, 'NOT_FOUND');
    }
    
    if (classDoc.current_semester >= 8) {
      return error(res, 'Class is already in final semester', 400, 'BAD_REQUEST');
    }

    classDoc.current_semester += 1;
    classDoc.current_year = Math.ceil(classDoc.current_semester / 2);
    await classDoc.save();

    eventPublisher.publish('ClassPromoted', {
      classId: classDoc._id,
      newSemester: classDoc.current_semester,
      newYear: classDoc.current_year
    });

    // Trigger recompute for SkillRack peer group
    const { recomputePeerGroup } = require('../services/skillrackScoring');
    recomputePeerGroup(classDoc._id).catch(err => console.error(err));

    success(res, { message: 'Class promoted successfully', class: classDoc });
  } catch (err) {
    next(err);
  }
};
