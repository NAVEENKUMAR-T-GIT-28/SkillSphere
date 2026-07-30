const InstitutionSettings = require('../models/InstitutionSettings');

const getSettings = (options = {}) => InstitutionSettings.findOne({}, null, options);

const updateSettings = (data, options = {}) => InstitutionSettings.findOneAndUpdate({}, data, { new: true, upsert: true, ...options });

module.exports = {
  getSettings,
  updateSettings
};
