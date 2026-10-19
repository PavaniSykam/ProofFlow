const dashboardService = require('../services/dashboardService');

const getEmployeeDashboard = async (req, res) => {
  const data = await dashboardService.getEmployeeDashboard(req.user._id);
  res.json(data);
};

const getApproverDashboard = async (req, res) => {
  const data = await dashboardService.getApproverDashboard(req.user);
  res.json(data);
};

module.exports = {
  getEmployeeDashboard,
  getApproverDashboard,
};
