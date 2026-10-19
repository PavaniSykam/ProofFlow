const express = require('express');
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middleware/authenticate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/', asyncHandler(notificationController.getNotifications));
router.get('/unread-count', asyncHandler(notificationController.getUnreadCount));
router.post('/:id/read', asyncHandler(notificationController.markRead));
router.post('/read-all', asyncHandler(notificationController.markAllRead));

module.exports = router;
