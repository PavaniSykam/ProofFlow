const express = require('express');
const approvalController = require('../controllers/approvalController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { approvalSchemas } = require('../validators/schemas');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/inbox', asyncHandler(approvalController.getInbox));

router.post(
  '/:stageInstanceId/approve',
  validate(approvalSchemas.action),
  asyncHandler(approvalController.approve)
);

router.post(
  '/:stageInstanceId/reject',
  validate(approvalSchemas.action),
  asyncHandler(approvalController.reject)
);

router.post(
  '/:stageInstanceId/request-changes',
  validate(approvalSchemas.action),
  asyncHandler(approvalController.requestChanges)
);

module.exports = router;
