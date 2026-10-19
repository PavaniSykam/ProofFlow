const StageInstance = require('../models/StageInstance');
const Organization = require('../models/Organization');
const { resolveAssignees } = require('./resolveAssignees');
const notificationService = require('../services/notificationService');
const auditService = require('../services/auditService');
const logger = require('../utils/logger');

/**
 * Advance the request to the next stage group after a stage is approved.
 *
 * Logic:
 * 1. If any instance in the current group is still active, stop (parallel group incomplete).
 * 2. Find the next waiting group by order.
 * 3. If one exists, activate it (resolve assignees, set deadlines, notify).
 * 4. If none exists, the request is fully approved — transition to approved.
 *
 * This function is idempotent: calling it when no advancement is needed is safe.
 *
 * @param {Object} request - The request document (populated with workflowVersionId)
 * @param {Object} requester - The requester user document
 * @param {Object} workflowVersion - The pinned workflow version
 * @returns {{ completed: boolean }} - Whether the request was fully completed
 */
async function advance(request, requester, workflowVersion) {
  const currentCycle = request.cycle;

  // Check if any instance in the current order group is still active
  const activeInCurrentGroup = await StageInstance.countDocuments({
    requestId: request._id,
    cycle: currentCycle,
    order: request.currentGroupOrder,
    status: 'active',
  });

  if (activeInCurrentGroup > 0) {
    // Parallel group not yet complete
    return { completed: false };
  }

  // Find the next waiting group (lowest order among waiting instances)
  const nextWaiting = await StageInstance.find({
    requestId: request._id,
    cycle: currentCycle,
    status: 'waiting',
  })
    .sort({ order: 1 })
    .lean();

  if (nextWaiting.length === 0) {
    // No more stages — request is complete
    return { completed: true };
  }

  // Get the next group order (all instances with the same lowest order)
  const nextGroupOrder = nextWaiting[0].order;
  const nextGroupInstances = nextWaiting.filter((si) => si.order === nextGroupOrder);

  // Get org settings for default SLA
  const org = await Organization.findOne();
  const defaultSlaHours = org?.settings?.defaultSlaHours || 48;

  // Activate each instance in the next group
  for (const instance of nextGroupInstances) {
    const stageDef = workflowVersion.stages.find((s) => s.key === instance.stageKey);
    if (!stageDef) {
      logger.error(`advance: Stage definition not found for key '${instance.stageKey}'`);
      continue;
    }

    const { assignees, needsAdminAttention } = await resolveAssignees(stageDef, request, requester);

    const slaHours = stageDef.slaHours || defaultSlaHours;
    const activatedAt = new Date();
    const dueAt = new Date(activatedAt.getTime() + slaHours * 60 * 60 * 1000);

    await StageInstance.findOneAndUpdate(
      { _id: instance._id, status: 'waiting' },
      {
        $set: {
          status: 'active',
          assignedTo: assignees,
          activatedAt,
          dueAt,
          needsAdminAttention,
        },
      }
    );

    // Audit: stage activated
    await auditService.record({
      requestId: request._id,
      requestNumber: request.requestNumber,
      actorId: null, // system
      action: 'stage_activated',
      stageKey: instance.stageKey,
      cycle: currentCycle,
      details: {
        stageName: instance.name,
        assignedTo: assignees,
        needsAdminAttention,
      },
    });

    // Notify assignees
    if (assignees.length > 0) {
      await notificationService.notify(
        assignees,
        'approval_required',
        request._id,
        `You have a new ${instance.name} approval to review for request ${request.requestNumber}`,
        `approval_required:${instance._id}`
      );
    }

    // Notify admins if no valid assignee found
    if (needsAdminAttention) {
      const User = require('../models/User');
      const admins = await User.find({ roles: 'admin', isActive: true }).select('_id');
      const adminIds = admins.map((a) => a._id);
      if (adminIds.length > 0) {
        await notificationService.notify(
          adminIds,
          'needs_admin_attention',
          request._id,
          `Request ${request.requestNumber} stage '${instance.name}' has no valid assignee and needs admin attention`,
          `needs_admin:${instance._id}`
        );
      }
    }
  }

  // Update the request's current group order
  const Request = require('../models/Request');
  await Request.findByIdAndUpdate(request._id, {
    $set: { currentGroupOrder: nextGroupOrder },
  });

  return { completed: false };
}

module.exports = { advance };
