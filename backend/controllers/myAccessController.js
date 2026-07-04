const { getMenteesForUser, getClassAccessForUser } = require('../services/myAccessService');
const { success, error } = require('../utils/response');

exports.getMentees = async (req, res, next) => {
  try {
    const students = await getMenteesForUser(req.user.userId);
    success(res, students, { total: students.length });
  } catch (err) { next(err); }
};

exports.getClassAccess = async (req, res, next) => {
  try {
    const students = await getClassAccessForUser(req.user.userId);
    success(res, students, { total: students.length });
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode, err.code);
    }
    next(err);
  }
};
