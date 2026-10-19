const Notification = require('../models/Notification');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Create notifications for one or more users.
   * Recipients are resolved on the server, never from client input.
   * Uses dedupeKey to prevent duplicates (e.g. "reminder:<stageInstanceId>").
   */
  async notify(userIdsOrOptions, type, requestId, message, dedupeKey = null) {
    let userIds = userIdsOrOptions;
    if (userIdsOrOptions && !Array.isArray(userIdsOrOptions) && typeof userIdsOrOptions === 'object') {
      userIds = userIdsOrOptions.userIds;
      type = userIdsOrOptions.type;
      requestId = userIdsOrOptions.requestId;
      message = userIdsOrOptions.message;
      dedupeKey = userIdsOrOptions.dedupeKey || null;
    }

    if (!userIds || userIds.length === 0) return;

    const docs = userIds.map((userId) => ({
      userId,
      type,
      requestId,
      message,
      dedupeKey: dedupeKey ? `${dedupeKey}:${userId}` : null,
    }));

    try {
      // insertMany with ordered: false to skip dupes (dedupeKey unique index)
      await Notification.insertMany(docs, { ordered: false });
    } catch (err) {
      // Ignore duplicate key errors from dedupeKey
      if (err.code !== 11000 && !err.writeErrors) {
        logger.error('NotificationService.notify error:', err.message);
      }
    }
  }

  async getForUser(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const query = { userId };
    if (unreadOnly) {
      query.readAt = null;
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);
    return { items, total, page, limit };
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({ userId, readAt: null });
  }

  async markRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId, readAt: null },
      { readAt: new Date() },
      { new: true }
    );
  }

  async markAllRead(userId) {
    return Notification.updateMany(
      { userId, readAt: null },
      { readAt: new Date() }
    );
  }
}

module.exports = new NotificationService();
