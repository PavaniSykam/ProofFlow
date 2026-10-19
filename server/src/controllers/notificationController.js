const notificationService = require('../services/notificationService');

const getNotifications = async (req, res) => {
  const result = await notificationService.getForUser(req.user._id, {
    page: req.query.page,
    limit: req.query.limit,
    unreadOnly: req.query.unreadOnly === 'true',
  });
  res.json(result);
};

const getUnreadCount = async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user._id);
  res.json({ unreadCount });
};

const markRead = async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user._id);
  res.json({ success: true, notification });
};

const markAllRead = async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  res.json({ success: true, message: 'All notifications marked as read' });
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
};
