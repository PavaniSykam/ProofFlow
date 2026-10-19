const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/employee', asyncHandler(dashboardController.getEmployeeDashboard));
router.get('/approver', asyncHandler(dashboardController.getApproverDashboard));

module.exports = router;
