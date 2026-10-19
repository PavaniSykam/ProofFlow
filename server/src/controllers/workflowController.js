const workflowService = require('../services/workflowService');

const getActiveWorkflows = async (req, res) => {
  const workflows = await workflowService.getAllActive(req.user.roles || []);
  res.json({ workflows });
};

const getWorkflowById = async (req, res) => {
  const workflow = await workflowService.getById(req.params.id);
  res.json({ workflow });
};

const getAdminWorkflows = async (req, res) => {
  const workflows = await workflowService.getAllForAdmin();
  res.json({ workflows });
};

const createWorkflow = async (req, res) => {
  const workflow = await workflowService.create(req.body, req.user._id);
  res.status(201).json({ workflow });
};

const updateWorkflow = async (req, res) => {
  const workflow = await workflowService.update(req.params.id, req.body, req.user._id);
  res.json({ workflow });
};

const toggleWorkflowActive = async (req, res) => {
  const workflow = await workflowService.toggleActive(req.params.id, req.body.isActive, req.user._id);
  res.json({ workflow });
};

const getWorkflowVersions = async (req, res) => {
  const versions = await workflowService.getVersions(req.params.id);
  res.json({ versions });
};

module.exports = {
  getActiveWorkflows,
  getWorkflowById,
  getAdminWorkflows,
  createWorkflow,
  updateWorkflow,
  toggleWorkflowActive,
  getWorkflowVersions,
};
