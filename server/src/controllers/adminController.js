const userService = require('../services/userService');
const departmentService = require('../services/departmentService');
const roleService = require('../services/roleService');
const dashboardService = require('../services/dashboardService');
const approvalService = require('../services/approvalService');
const Request = require('../models/Request');
const StageInstance = require('../models/StageInstance');
const User = require('../models/User');

const getUsers = async (req, res) => {
  const users = await userService.getAll(req.query);
  res.json({ users });
};

const createUser = async (req, res) => {
  const user = await userService.create(req.body, req.user._id);
  res.status(201).json({ user });
};

const updateUser = async (req, res) => {
  const user = await userService.update(req.params.id, req.body, req.user._id);
  res.json({ user });
};

const deactivateUser = async (req, res) => {
  const confirm = req.body?.confirmPendingReassignment !== false;
  const result = await userService.deactivate(req.params.id, confirm, req.user._id);
  res.json(result);
};

const resetUserPassword = async (req, res) => {
  const result = await userService.resetPassword(req.params.id, req.body.newPassword, req.user._id);
  res.json(result);
};

const getOrgChart = async (req, res) => {
  const chart = await userService.getOrgChart();
  res.json({ orgChart: chart });
};

const getDepartments = async (req, res) => {
  const departments = await departmentService.getAll();
  res.json({ departments });
};

const createDepartment = async (req, res) => {
  const department = await departmentService.create(req.body, req.user._id);
  res.status(201).json({ department });
};

const updateDepartment = async (req, res) => {
  const department = await departmentService.update(req.params.id, req.body, req.user._id);
  res.json({ department });
};

const getRoles = async (req, res) => {
  const roles = await roleService.getAll();
  res.json({ roles });
};

const createRole = async (req, res) => {
  const role = await roleService.create(req.body, req.user._id);
  res.status(201).json({ role });
};

const updateRole = async (req, res) => {
  const role = await roleService.update(req.params.key, req.body, req.user._id);
  res.json({ role });
};

const getAdminStats = async (req, res) => {
  const stats = await dashboardService.getAdminStats();
  res.json(stats);
};

const getAdminRequests = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.workflowId) filter.workflowId = req.query.workflowId;
  if (req.query.search) filter.requestNumber = new RegExp(req.query.search, 'i');

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('workflowId', 'name key')
      .populate('requesterId', 'name email')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Request.countDocuments(filter),
  ]);

  const enriched = await Promise.all(
    requests.map(async (r) => {
      const activeStages = await StageInstance.find({
        requestId: r._id,
        cycle: r.cycle,
        status: 'active',
      })
        .populate('assignedTo', 'name email')
        .populate('escalatedTo', 'name email')
        .lean();

      const isOverdue = activeStages.some((s) => s.dueAt && new Date(s.dueAt) < new Date());
      const needsAdminAttention = activeStages.some((s) => s.needsAdminAttention);

      return {
        ...r,
        activeStages,
        isOverdue,
        needsAdminAttention,
      };
    })
  );

  res.json({
    requests: enriched,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  });
};

const reassignStage = async (req, res) => {
  const instance = await approvalService.reassignStage(
    req.params.id,
    req.body.newAssigneeId,
    req.user._id
  );
  res.json({ success: true, instance });
};

const userLookup = async (req, res) => {
  const query = { isActive: true };
  if (req.query.role) {
    query.roles = req.query.role;
  }
  const users = await User.find(query)
    .select('_id name email roles departmentId managerId')
    .populate('departmentId', 'name code')
    .sort({ name: 1 })
    .lean();
  res.json({ users });
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  resetUserPassword,
  getOrgChart,
  getDepartments,
  createDepartment,
  updateDepartment,
  getRoles,
  createRole,
  updateRole,
  getAdminStats,
  getAdminRequests,
  reassignStage,
  userLookup,
};
