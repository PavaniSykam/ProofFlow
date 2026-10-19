const express = require('express');
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const {
  adminUserSchemas,
  departmentSchemas,
  roleSchemas,
  approvalSchemas,
} = require('../validators/schemas');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User lookup for authenticated users (delegation/reporting pickers)
router.get('/lookup', asyncHandler(adminController.userLookup));

// Admin-only barrier
router.use(requireRole('admin'));

// Users
router.get('/users', asyncHandler(adminController.getUsers));
router.post(
  '/users',
  validate(adminUserSchemas.create),
  asyncHandler(adminController.createUser)
);
router.patch(
  '/users/:id',
  validate(adminUserSchemas.update),
  asyncHandler(adminController.updateUser)
);
router.post(
  '/users/:id/deactivate',
  validate(adminUserSchemas.deactivate),
  asyncHandler(adminController.deactivateUser)
);
router.post(
  '/users/:id/reset-password',
  validate(adminUserSchemas.resetPassword),
  asyncHandler(adminController.resetUserPassword)
);

// Departments
router.get('/departments', asyncHandler(adminController.getDepartments));
router.post(
  '/departments',
  validate(departmentSchemas.create),
  asyncHandler(adminController.createDepartment)
);
router.patch(
  '/departments/:id',
  validate(departmentSchemas.update),
  asyncHandler(adminController.updateDepartment)
);

// Roles
router.get('/roles', asyncHandler(adminController.getRoles));
router.post(
  '/roles',
  validate(roleSchemas.create),
  asyncHandler(adminController.createRole)
);
router.patch(
  '/roles/:key',
  validate(roleSchemas.update),
  asyncHandler(adminController.updateRole)
);

// Hierarchy & Org Chart
router.get('/org-chart', asyncHandler(adminController.getOrgChart));

// Dashboard Stats & Monitoring
router.get('/stats', asyncHandler(adminController.getAdminStats));
router.get('/requests', asyncHandler(adminController.getAdminRequests));

// In-flight stage reassignment (Section 4A.7)
router.post(
  '/stage-instances/:id/reassign',
  validate(approvalSchemas.reassign),
  asyncHandler(adminController.reassignStage)
);

module.exports = router;
