const express = require('express');
const aiController = require('../controllers/aiController');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.post('/requests/:id/summary', asyncHandler(aiController.generateSummary));
router.get('/requests/:id/summary', asyncHandler(aiController.getSummary));

module.exports = router;
