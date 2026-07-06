// controllers/searchController.js
const { searchStudentsV2 } = require('../services/search');
const { success } = require('../utils/response');

exports.searchStudentsV2 = async (req, res, next) => {
  try {
    const { students, meta } = await searchStudentsV2(req.query);
    success(res, students, meta);
  } catch (err) {
    next(err);
  }
};
