// controllers/searchController.js
const { searchStudents, searchStudentsV2 } = require('../services/search');
const { success } = require('../utils/response');

exports.searchStudents = async (req, res, next) => {
  try {
    const { students, meta } = await searchStudents(req.query);
    success(res, students, meta);
  } catch (err) {
    next(err);
  }
};

exports.searchStudentsV2 = async (req, res, next) => {
  try {
    const { students, meta } = await searchStudentsV2(req.query);
    success(res, students, meta);
  } catch (err) {
    next(err);
  }
};
