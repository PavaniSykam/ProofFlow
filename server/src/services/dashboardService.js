const Request = require('../models/Request');
const StageInstance = require('../models/StageInstance');
const User = require('../models/User');
const Department = require('../models/Department');
const Workflow = require('../models/Workflow');
const Delegation = require('../models/Delegation');

class DashboardService {
  async getEmployeeDashboard(userId) {
    const [
      total,
      drafts,
      pending,
      approved,
      rejected,
      changesRequested,
      recentRequests,
      actionRequired,
    ] = await Promise.all([
      Request.countDocuments({ requesterId: userId }),
      Request.countDocuments({ requesterId: userId, status: 'draft' }),
      Request.countDocuments({ requesterId: userId, status: 'pending' }),
      Request.countDocuments({ requesterId: userId, status: 'approved' }),
      Request.countDocuments({ requesterId: userId, status: 'rejected' }),
      Request.countDocuments({ requesterId: userId, status: 'changes_requested' }),
      Request.find({ requesterId: userId })
        .populate('workflowId', 'name key')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      Request.find({ requesterId: userId, status: 'changes_requested' })
        .populate('workflowId', 'name key')
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    return {
      stats: {
        total,
        drafts,
        pending,
        approved,
        rejected,
        changesRequested,
      },
      recentRequests,
      actionRequired,
    };
  }

  async getApproverDashboard(user) {
    const userId = user._id;
    const now = new Date();

    // Check delegations
    const activeDelegations = await Delegation.find({
      delegateId: userId,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
      revokedAt: null,
    }).select('delegatorId');

    const eligibleUserIds = [userId, ...activeDelegations.map((d) => d.delegatorId)];

    const [waitingCount, overdueCount, processedCount, urgentItems, recentProcessed] =
      await Promise.all([
        StageInstance.countDocuments({
          status: 'active',
          $or: [{ dueAt: null }, { dueAt: { $gte: now } }],
          $or: [{ assignedTo: { $in: eligibleUserIds } }, { escalatedTo: { $in: eligibleUserIds } }],
        }),
        StageInstance.countDocuments({
          status: 'active',
          dueAt: { $lt: now },
          $or: [{ assignedTo: { $in: eligibleUserIds } }, { escalatedTo: { $in: eligibleUserIds } }],
        }),
        StageInstance.countDocuments({
          status: { $in: ['approved', 'rejected', 'changes_requested'] },
          $or: [{ actedBy: userId }, { onBehalfOf: userId }],
        }),
        StageInstance.find({
          status: 'active',
          $or: [{ assignedTo: { $in: eligibleUserIds } }, { escalatedTo: { $in: eligibleUserIds } }],
        })
          .populate({
            path: 'requestId',
            populate: [
              { path: 'requesterId', select: 'name email' },
              { path: 'workflowId', select: 'name key' },
            ],
          })
          .sort({ dueAt: 1 })
          .limit(5)
          .lean(),
        StageInstance.find({
          status: { $in: ['approved', 'rejected', 'changes_requested'] },
          $or: [{ actedBy: userId }, { onBehalfOf: userId }],
        })
          .populate({
            path: 'requestId',
            populate: [
              { path: 'requesterId', select: 'name email' },
              { path: 'workflowId', select: 'name key' },
            ],
          })
          .sort({ actedAt: -1 })
          .limit(5)
          .lean(),
      ]);

    return {
      stats: {
        waiting: waitingCount,
        overdue: overdueCount,
        processed: processedCount,
      },
      urgentItems: urgentItems.filter((i) => i.requestId && !i.requestId.requesterId._id.equals(userId)),
      recentProcessed,
    };
  }

  async getAdminStats() {
    const now = new Date();
    const [
      totalUsers,
      activeUsers,
      totalDepartments,
      totalWorkflows,
      totalRequests,
      statusCounts,
      needsAttentionCount,
      overdueCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      Workflow.countDocuments(),
      Request.countDocuments(),
      Request.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      StageInstance.countDocuments({ status: 'active', needsAdminAttention: true }),
      StageInstance.countDocuments({ status: 'active', dueAt: { $lt: now } }),
    ]);

    const statusMap = {};
    statusCounts.forEach((sc) => {
      statusMap[sc._id] = sc.count;
    });

    return {
      users: { total: totalUsers, active: activeUsers },
      departments: totalDepartments,
      workflows: totalWorkflows,
      requests: {
        total: totalRequests,
        pending: statusMap.pending || 0,
        approved: statusMap.approved || 0,
        rejected: statusMap.rejected || 0,
        changesRequested: statusMap.changes_requested || 0,
        drafts: statusMap.draft || 0,
        cancelled: statusMap.cancelled || 0,
      },
      alerts: {
        needsAttention: needsAttentionCount,
        overdue: overdueCount,
      },
    };
  }
}

module.exports = new DashboardService();
