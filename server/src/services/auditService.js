const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class AuditService {
  /**
   * Record an audit entry. This is the ONLY writer for AuditLog documents.
   * Called by services and the engine, never by controllers from client input.
   */
  async record({
    requestId,
    requestNumber,
    actorId = null,
    onBehalfOfId = null,
    action,
    fromStatus = null,
    toStatus = null,
    stageKey = null,
    cycle = null,
    details = null,
  }) {
    try {
      const entry = new AuditLog({
        requestId,
        requestNumber,
        actorId,
        onBehalfOfId,
        action,
        fromStatus,
        toStatus,
        stageKey,
        cycle,
        details,
      });
      await entry.save();
      return entry;
    } catch (err) {
      logger.error('AuditService.record error:', err.message);
      // Audit failures should not crash the application,
      // but should be visible in logs
      throw err;
    }
  }

  /**
   * Get audit entries for a request, in ascending time order.
   */
  async getForRequest(requestId) {
    return AuditLog.find({ requestId })
      .sort({ createdAt: 1 })
      .populate('actorId', 'name email')
      .populate('onBehalfOfId', 'name email')
      .lean();
  }
}

module.exports = new AuditService();
