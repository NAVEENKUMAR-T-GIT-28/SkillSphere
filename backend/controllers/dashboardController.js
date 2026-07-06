const dashboardService = require('../services/dashboard/dashboard.service');

exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const dashboardData = await dashboardService.getDashboardData(userId);
    res.json({ success: true, data: dashboardData });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
};
