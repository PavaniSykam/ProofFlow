const StageInstance = require('../models/StageInstance');
const Request = require('../models/Request');
const Delegation = require('../models/Delegation');
const User = require('../models/User');
const { performAction } = require('../engine/action');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const AppError = require('../utils/AppError');

class ApprovalService {
  async getInbox(user, { tab = 'waiting', page = 1, limit = 20 }) {
    const userId = user._id;
    const now = new Date();

    // 1. Find all active delegations where user is the delegate
    const activeDelegations = await Delegation.find({
      delegateId: userId,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
      revokedAt: null,
    }).populate('delegatorId', 'name email');

    const delegatorMap = {};
    const delegatorIds = activeDelegations.map((d) => {
      delegatorMap[d.delegatorId._id.toString()] = {
        name: d.delegatorId.name,
        workflowIds: d.workflowIds || [],
      };
      return d.delegatorId._id;
    });

    const eligibleUserIds = [userId, ...delegatorIds];

    let filter = {};

    if (tab === 'waiting') {
      filter = {
        status: 'active',
        $or: [{ dueAt: null }, { dueAt: { $gte: now } }],
        $or: [
          { assignedTo: { $in: eligibleUserIds } },
          { escalatedTo: { $in: eligibleUserIds } },
        ],
      };
    } else if (tab === 'overdue') {
      filter = {
        status: 'active',
        dueAt: { $lt: now },
        $or: [
          { assignedTo: { $in: eligibleUserIds } },
          { escalatedTo: { $in: eligibleUserIds } },
        ],
      };
    } else if (tab === 'processed') {
      filter = {
        status: { $in: ['approved', 'rejected', 'changes_requested'] },
        $or: [{ actedBy: userId }, { onBehalfOf: userId }],
      };
    } else {
      throw new AppError('VALIDATION_ERROR', 400, `Invalid tab: ${tab}`);
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [instances, total] = await Promise.all([
      StageInstance.find(filter)
        .populate({
          path: 'requestId',
          populate: [
            { path: 'requesterId', select: 'name email departmentId' },
            { path: 'workflowId', select: 'name key' },
            { path: 'departmentId', select: 'name code' },
          ],
        })
        .populate('assignedTo', 'name email roles')
        .populate('escalatedTo', 'name email roles')
        .populate('actedBy', 'name email')
        .sort(tab === 'processed' ? { actedAt: -1 } : { activatedAt: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StageInstance.countDocuments(filter),
    ]);

    // Tag items if visible via delegation & filter out if workflow not allowed in delegation
    const enriched = instances
      .filter((inst) => {
        if (!inst.requestId) return false;
        // Self-approval exclusion: requester cannot approve own request
        if (inst.requestId.requesterId && inst.requestId.requesterId._id.toString() === userId.toString()) {
          return false;
        }

        const isDirect =
          (inst.assignedTo && inst.assignedTo.some((u) => u._id.toString() === userId.toString())) ||
          (inst.escalatedTo && inst.escalatedTo.some((u) => u._id.toString() === userId.toString()));

        if (isDirect) return true;

        // Check delegation workflow restrictions
        for (const delId of delegatorIds) {
          const idStr = delId.toString();
          const inAssigned = inst.assignedTo && inst.assignedTo.some((u) => u._id.toString() === idStr);
          const inEscalated = inst.escalatedTo && inst.escalatedTo.some((u) => u._id.toString() === idStr);
          if (inAssigned || inEscalated) {
            const rule = delegatorMap[idStr];
            if (!rule.workflowIds || rule.workflowIds.length === 0) return true;
            if (rule.workflowIds.map((w) => w.toString()).includes(inst.requestId.workflowId._id.toString())) {
              return true;
            }
          }
        }
        return false;
      })
      .map((inst) => {
        let isDelegated = false;
        let delegatedFor = null;

        const isDirect =
          (inst.assignedTo && inst.assignedTo.some((u) => u._id.toString() === userId.toString())) ||
          (inst.escalatedTo && inst.escalatedTo.some((u) => u._id.toString() === userId.toString()));

        if (!isDirect) {
          for (const delId of delegatorIds) {
            const idStr = delId.toString();
            const inAssigned = inst.assignedTo && inst.assignedTo.some((u) => u._id.toString() === idStr);
            const inEscalated = inst.escalatedTo && inst.escalatedTo.some((u) => u._id.toString() === idStr);
            if (inAssigned || inEscalated) {
              isDelegated = true;
              delegatedFor = delegatorMap[idStr]?.name;
              break;
            }
          }
        }

        return {
          ...inst,
          isOverdue: inst.status === 'active' && inst.dueAt && new Date(inst.dueAt) < now,
          isDelegated,
          delegatedFor,
        };
      });

    return {
      items: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  async approve(stageInstanceId, comment, user) {
    return performAction(stageInstanceId, user._id, 'approve', comment);
  }

  async reject(stageInstanceId, comment, user) {
    return performAction(stageInstanceId, user._id, 'reject', comment);
  }

  async requestChanges(stageInstanceId, comment, user) {
    return performAction(stageInstanceId, user._id, 'request_changes', comment);
  }

  /**
   * Admin stage reassignment.
   * Section 4A.7: lets an admin move an active stage to a new eligible assignee.
   * Audited as stage_reassigned; notifies old and new assignees. Admin has no approval authority.
   */
  async reassignStage(stageInstanceId, newAssigneeId, adminId) {
    const instance = await StageInstance.findById(stageInstanceId);
    if (!instance) {
      throw new AppError('NOT_FOUND', 404, 'Stage instance not found');
    }
    if (instance.status !== 'active') {
      throw new AppError('INVALID_STATE', 409, 'Only active stage instances can be reassigned');
    }

    const request = await Request.findById(instance.requestId);
    if (!request) {
      throw new AppError('NOT_FOUND', 404, 'Request not found');
    }

    // New assignee must be active and cannot be the requester
    const newAssignee = await User.findById(newAssigneeId);
    if (!newAssignee || !newAssignee.isActive) {
      throw new AppError('VALIDATION_ERROR', 400, 'New assignee must be an active user');
    }
    if (newAssignee._id.equals(request.requesterId)) {
      throw new AppError('SELF_APPROVAL', 400, 'Cannot reassign stage to the requester');
    }

    const oldAssignees = [...instance.assignedTo];
    instance.assignedTo = [newAssignee._id];
    instance.needsAdminAttention = false;
    await instance.save();

    // Audit log
    await auditService.record({
      requestId: request._id,
      requestNumber: request.requestNumber,
      actorId: adminId,
      action: 'stage_reassigned',
      fromStatus: request.status,
      toStatus: request.status,
      stageKey: instance.stageKey,
      cycle: instance.cycle,
      details: {
        stageName: instance.name,
        oldAssignees,
        newAssigneeId: newAssignee._id,
        newAssigneeName: newAssignee.name,
      },
    });

    // Notify old and new assignees
    if (oldAssignees.length > 0) {
      await notificationService.notify({
        userIds: oldAssignees,
        type: 'needs_admin_attention',
        requestId: request._id,
        message: `Stage '${instance.name}' for request ${request.requestNumber} was reassigned by an administrator.`,
      });
    }
    await notificationService.notify({
      userIds: [newAssignee._id],
      type: 'approval_required',
      requestId: request._id,
      message: `You have been assigned to stage '${instance.name}' for request ${request.requestNumber} by an administrator.`,
    });

    return instance;
  }
}

module.exports = new ApprovalService();
