const Request = require('../models/Request');
const StageInstance = require('../models/StageInstance');
const WorkflowVersion = require('../models/WorkflowVersion');
const { transitionRequest } = require('./transitions');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');

/**
 * Cancel a request.
 *
 * Rules:
 * - Requester only
 * - Status must be draft, pending, or changes_requested
 * - The workflow version must allow cancellation (settings.allowCancel)
 * - No completed stage with locksCancellation may exist
 *
 * Effects:
 * - Cancel all active/waiting stage instances
 * - Transition to cancelled
 * - Audit and notify current assignees
 */
async function cancelRequest(requestId, userId) {
  const request = await Request.findById(requestId);
  if (!request) {
    throw new AppError('NOT_FOUND', 404, 'Request not found');
  }
  if (!request.requesterId.equals(userId)) {
    throw new AppError('FORBIDDEN', 403, 'You can only cancel your own requests');
  }

  const allowedStatuses = ['draft', 'pending', 'changes_requested'];
  if (!allowedStatuses.includes(request.status)) {
    throw new AppError('INVALID_TRANSITION', 409, `Cannot cancel a request in '${request.status}' status`);
  }

  // Check workflow version settings
  const workflowVersion = await WorkflowVersion.findById(request.workflowVersionId);
  if (workflowVersion && !workflowVersion.settings.allowCancel) {
    throw new AppError('CANCEL_NOT_ALLOWED', 403, 'This workflow does not allow cancellation');
  }

  // Check for completed stages with locksCancellation
  if (workflowVersion) {
    const lockingStageKeys = workflowVersion.stages
      .filter((s) => s.locksCancellation)
      .map((s) => s.key);

    if (lockingStageKeys.length > 0) {
      const completedLocking = await StageInstance.countDocuments({
        requestId: request._id,
        stageKey: { $in: lockingStageKeys },
        status: 'approved',
      });

      if (completedLocking > 0) {
        throw new AppError(
          'CANCEL_LOCKED',
          403,
          'Cannot cancel: a locking stage has already been completed'
        );
      }
    }
  }

  // Gather current assignees for notification before cancelling
  const activeInstances = await StageInstance.find({
    requestId: request._id,
    cycle: request.cycle,
    status: 'active',
  });
  const currentAssignees = [];
  for (const inst of activeInstances) {
    currentAssignees.push(...inst.assignedTo, ...inst.escalatedTo);
  }

  // Cancel all active/waiting instances
  await StageInstance.updateMany(
    {
      requestId: request._id,
      cycle: request.cycle,
      status: { $in: ['active', 'waiting'] },
    },
    { $set: { status: 'cancelled' } }
  );

  // Transition to cancelled
  const updatedRequest = await transitionRequest(request._id, request.status, 'cancelled');

  // Audit
  await auditService.record({
    requestId: request._id,
    requestNumber: request.requestNumber,
    actorId: userId,
    action: 'cancelled',
    fromStatus: request.status,
    toStatus: 'cancelled',
    cycle: request.cycle,
  });

  // Notify current assignees
  const uniqueAssignees = [...new Set(currentAssignees.map((a) => a.toString()))];
  if (uniqueAssignees.length > 0) {
    await notificationService.notify(
      uniqueAssignees,
      'cancelled',
      request._id,
      `Request ${request.requestNumber} has been cancelled by the requester`,
    );
  }

  return updatedRequest;
}

module.exports = { cancelRequest };
