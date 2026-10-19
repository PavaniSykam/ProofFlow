const express = require('express');
const workflowController = require('../controllers/workflowController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { workflowSchemas } = require('../validators/schemas');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

// Public (all authenticated employees)
router.get('/', asyncHandler(workflowController.getActiveWorkflows));
router.get('/:id', asyncHandler(workflowController.getWorkflowById));

// Admin workflow builder endpoints
router.get('/admin/all', requireRole('admin'), asyncHandler(workflowController.getAdminWorkflows));
router.post(
  '/admin',
  requireRole('admin'),
  validate(workflowSchemas.create),
  asyncHandler(workflowController.createWorkflow)
);
router.put(
  '/admin/:id',
  requireRole('admin'),
  validate(workflowSchemas.update),
  asyncHandler(workflowController.updateWorkflow)
);
router.patch(
  '/admin/:id/active',
  requireRole('admin'),
  asyncHandler(workflowController.toggleWorkflowActive)
);
router.get(
  '/admin/:id/versions',
  requireRole('admin'),
  asyncHandler(workflowController.getWorkflowVersions)
);

module.exports = router;
