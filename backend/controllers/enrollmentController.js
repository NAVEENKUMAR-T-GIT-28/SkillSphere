const EnrollmentService = require('../services/enrollmentService');
const studentRepo = require('../repositories/studentRepo');
const StudentWorkspaceQueryService = require('../services/studentWorkspace/studentWorkspaceQuery.service');

/**
 * EnrollmentController
 * Extremely thin controller delegating to EnrollmentService.
 * Handles HTTP requests, parses queries, and formats responses.
 */

const createStudent = async (req, res, next) => {
  try {
    const actorId = req.user.userId; // auth middleware sets req.user.userId
    const payload = req.validatedData; // Set by enrollmentValidator

    const result = await EnrollmentService.createStudent({ payload, actorId });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Student successfully enrolled'
    });
  } catch (error) {
    next(error);
  }
};

const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, class_id, status } = req.query;
    
    if (!class_id) {
      return res.status(400).json({ success: false, message: 'class_id is required' });
    }

    const data = await StudentWorkspaceQueryService.getWorkspaceSummary(class_id, page, limit, search, status);
    
    if (!data) {
      return res.status(404).json({ success: false, message: 'Class workspace not found or empty' });
    }

    res.status(200).json({
      success: true,
      data: data.workspace,
      message: 'Workspace fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentWorkspace = await StudentWorkspaceQueryService.getStudentWorkspace(id);
    
    if (!studentWorkspace) {
      return res.status(404).json({ success: false, message: 'Student projection not found' });
    }
    
    res.status(200).json({
      success: true,
      data: studentWorkspace,
      message: 'Student fetched successfully'
    });
  } catch (error) {
    next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.userId;
    const payload = req.validatedData;
    
    const result = await EnrollmentService.updateStudent(id, payload, actorId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Student updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

const changeClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.userId;
    const { class_id } = req.validatedData;

    const result = await EnrollmentService.changeClass(id, class_id, actorId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Student class changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.userId;

    const result = await EnrollmentService.resetPassword(id, actorId);
    
    res.status(200).json({
      success: true,
      data: result,
      message: 'Student password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.userId;
    const { status, reason } = req.validatedData;

    let result;
    if (status === 'SUSPENDED') {
      result = await EnrollmentService.suspendStudent(id, reason, actorId);
    } else if (status === 'ACTIVE') {
      result = await EnrollmentService.activateStudent(id, actorId);
    } else if (status === 'DROPPED') {
      result = await EnrollmentService.softDeleteStudent(id, actorId);
    }

    res.status(200).json({
      success: true,
      data: result,
      message: `Student status changed to ${status}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  changeClass,
  resetPassword,
  changeStatus
};
