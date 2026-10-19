const express = require('express');
const requestController = require('../controllers/requestController');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/:id/download', asyncHandler(requestController.downloadAttachment));
router.delete('/:id', asyncHandler(requestController.deleteAttachment));

module.exports = router;
