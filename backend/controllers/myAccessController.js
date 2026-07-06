const { getMenteesForUser, getClassAccessForUser } = require('../services/myAccessService');
const { success, error } = require('../utils/response');

exports.getMentees = async (req, res, next) => {
  try {
    const userFullName = req.user.name || 'Mentor';
    const result = await getMenteesForUser(req.user.userId, userFullName, req.query);
    res.status(200).json({ success: true, ...result });
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
