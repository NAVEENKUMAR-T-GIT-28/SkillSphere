// controllers/projectController.js
const { validationResult } = require('express-validator');
const projectRepo = require('../repositories/projectRepo');
const verificationLogRepo = require('../repositories/verificationLogRepo');
const { recalculateScore } = require('../services/readinessScore');
const { success, error } = require('../utils/response');

exports.getProjects = async (req, res, next) => {
  try {
    const { status } = req.query;
    let projects = await projectRepo.findByStudentIds(req.params.studentId);
    if (status) projects = projects.filter(p => p.status === status);
    projects.sort((a, b) => b.created_at - a.created_at);

    success(res, projects, { total: projects.length });
  } catch (err) {
    next(err);
  }
};

exports.addProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const projectData = {
      ...req.body, created_by: req.params.studentId, status: 'pending'
    };
    if (!projectData.student_ids || projectData.student_ids.length === 0) {
      projectData.student_ids = [req.params.studentId];
    } else if (!projectData.student_ids.includes(req.params.studentId)) {
      projectData.student_ids.push(req.params.studentId);
    }

    const project = await projectRepo.create(projectData);

    await verificationLogRepo.create({
      item_type: 'project', item_id: project._id, student_id: req.params.studentId, actor_id: req.user.userId,
      action: 'submitted', comment: `Project "${req.body.title}" submitted for review`
    });

    success(res, project, {}, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    let project = await projectRepo.findByStudentAndId(req.params.studentId, req.params.projectId);
    if (!project) {
      return error(res, 'Project not found', 404, 'NOT_FOUND');
    }

    if (project.status === 'reviewed') {
      return error(res, 'Cannot edit a reviewed project. Submit a new version instead.', 400, 'CANNOT_EDIT_REVIEWED');
    }

    const allowedFields = ['title', 'description', 'tech_stack', 'github_url', 'live_demo_url', 'complexity_tier', 'student_ids'];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (project.status === 'rejected') {
      updateData.status = 'pending';
      updateData.rejection_reason = undefined;
    }

    project = await projectRepo.updateById(req.params.projectId, updateData);
    success(res, project);
  } catch (err) {
    next(err);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await projectRepo.findByStudentAndId(req.params.studentId, req.params.projectId);
    if (!project) {
      return error(res, 'Project not found', 404, 'NOT_FOUND');
    }
    if (project.status === 'reviewed') {
      return error(res, 'Cannot delete a reviewed project', 400, 'CANNOT_DELETE_REVIEWED');
    }
    await projectRepo.deleteById(req.params.projectId);
    success(res, { message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.rateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, errors.array().map(e => e.msg).join(', '), 400, 'VALIDATION_ERROR');
    }

    const project = await projectRepo.findById(req.params.projectId);
    if (!project) {
      return error(res, 'Project not found', 404, 'NOT_FOUND');
    }

    const { functionality, code_quality, documentation, innovation, complexity, feedback } = req.body;
    const average = (functionality + code_quality + documentation + innovation + complexity) / 5;

    const updated = await projectRepo.updateById(req.params.projectId, {
      status: 'reviewed',
      faculty_rating: { functionality, code_quality, documentation, innovation, complexity, average, feedback, rated_by: req.user.userId, rated_at: new Date() }
    });

    for (const sid of project.student_ids) {
      await recalculateScore(sid);
    }

    success(res, updated);
  } catch (err) {
    next(err);
  }
};
