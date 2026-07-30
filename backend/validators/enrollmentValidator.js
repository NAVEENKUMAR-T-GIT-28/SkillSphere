const Joi = require('joi');
const userRepo = require('../repositories/userRepo');
const studentRepo = require('../repositories/studentRepo');
const classRepo = require('../repositories/classRepo');
const InstitutionSettingsService = require('../services/institutionSettingsService');

const createStudentSchema = Joi.object({
  full_name: Joi.string().trim().required(),
  roll_number: Joi.string().trim().required(),
  register_number: Joi.string().trim().allow(null, ''),
  class_id: Joi.string().hex().length(24).required(),
  personal_email: Joi.string().email().trim().allow(null, ''),
  phone: Joi.string().trim().allow(null, '')
});

const updateStudentSchema = Joi.object({
  full_name: Joi.string().trim(),
  personal_email: Joi.string().email().trim().allow(null, ''),
  phone: Joi.string().trim().allow(null, '')
});

const validateCreateStudent = async (req, res, next) => {
  try {
    const { error, value } = createStudentSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });
    
    // Check class existence
    const classDoc = await classRepo.findById(value.class_id);
    if (!classDoc) return res.status(404).json({ success: false, message: 'Class not found' });
    
    // Check Duplicate Roll Number
    const existingRoll = await studentRepo.findOne({ roll_number: value.roll_number });
    if (existingRoll) return res.status(409).json({ success: false, message: 'Roll number already exists' });
    
    // Check Duplicate Register Number
    if (value.register_number) {
      const existingReg = await studentRepo.findOne({ register_number: value.register_number });
      if (existingReg) return res.status(409).json({ success: false, message: 'Register number already exists' });
    }
    
    // Check identifier uniqueness based on login strategy
    const settings = await InstitutionSettingsService.getSettings();
    let identifier = value.roll_number;
    if (settings.login_strategy === 'REGISTER_NUMBER') {
      if (!value.register_number) return res.status(400).json({ success: false, message: 'Register number is required by institution login strategy' });
      identifier = value.register_number;
    } else if (settings.login_strategy === 'EMAIL') {
      return res.status(400).json({ success: false, message: 'EMAIL strategy requires email in payload, currently not supported in this MVP' });
    }
    
    const existingUser = await userRepo.findByLoginIdentifier(identifier);
    if (existingUser) return res.status(409).json({ success: false, message: 'Login identifier already exists in system' });
    
    // Attach validated and inferred data to req.locals for controller
    req.validatedData = {
      ...value,
      login_identifier: identifier,
      classDoc
    };
    next();
  } catch (err) {
    next(err);
  }
};

const validateUpdateStudent = async (req, res, next) => {
  try {
    const { error, value } = updateStudentSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });
    req.validatedData = value;
    next();
  } catch (err) {
    next(err);
  }
};

const validateChangeClass = async (req, res, next) => {
  try {
    const { class_id } = req.body;
    if (!class_id) return res.status(400).json({ success: false, message: 'class_id is required' });
    const classDoc = await classRepo.findById(class_id);
    if (!classDoc) return res.status(404).json({ success: false, message: 'Target class not found' });
    req.validatedData = { class_id, classDoc };
    next();
  } catch (err) {
    next(err);
  }
};

const validateChangeStatus = async (req, res, next) => {
  try {
    const schema = Joi.object({
      status: Joi.string().valid('SUSPENDED', 'ACTIVE', 'DROPPED').required(),
      reason: Joi.string().optional()
    });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });
    req.validatedData = value;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  validateCreateStudent,
  validateUpdateStudent,
  validateChangeClass,
  validateChangeStatus
};
