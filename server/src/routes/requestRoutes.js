const express = require('express');
const requestController = require('../controllers/requestController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { requestSchemas } = require('../validators/schemas');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

// Request listings & details
router.get('/mine', asyncHandler(requestController.getMine));
router.get('/:id', asyncHandler(requestController.getById));
router.get('/:id/audit', asyncHandler(requestController.getAudit));

// Draft lifecycle
router.post(
  '/',
  validate(requestSchemas.createDraft),
  asyncHandler(requestController.createDraft)
);
router.put(
  '/:id',
  validate(requestSchemas.updateDraft),
  asyncHandler(requestController.updateDraft)
);
router.delete('/:id', asyncHandler(requestController.deleteDraft));

// Transitions
router.post('/:id/submit', asyncHandler(requestController.submit));
router.post(
  '/:id/resubmit',
  validate(requestSchemas.resubmit),
  asyncHandler(requestController.resubmit)
);
router.post('/:id/cancel', asyncHandler(requestController.cancel));

// Attachments
router.post(
  '/:id/attachments',
  upload.single('file'),
  asyncHandler(requestController.uploadAttachment)
);

module.exports = router;
