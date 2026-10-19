const Request = require('../models/Request');
const StageInstance = require('../models/StageInstance');
const WorkflowVersion = require('../models/WorkflowVersion');
const User = require('../models/User');
const Delegation = require('../models/Delegation');
const { transitionRequest } = require('./transitions');
const { advance } = require('./advance');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Check if a user has an active delegation from one of the assigned users.
 * Returns the delegator user if found, null otherwise.
 */
async function findActiveDelegation(userId, assignedToIds, escalatedToIds, workflowId) {
  const now = new Date();
  const allEligible = [...assignedToIds.map(id => id.toString()), ...escalatedToIds.map(id => id.toString())];
  
  const delegation = await Delegation.findOne({
    delegateId: userId,
    delegatorId: { $in: allEligible },
    startsAt: { $lte: now },
    endsAt: { $gte: now },
    revokedAt: null,
    $or: [
      { workflowIds: { $size: 0 } },
      { workflowIds: workflowId },
    ],
  });

  return delegation;
}

/**
 * Perform an approval action on a stage instance.
 *
 * Actions: approve, reject, request_changes
 *
 * Authorization:
 * 1. User must be in assignedTo or escalatedTo, or have an active delegation
 * 2. User must NOT be the requester (self-approval prevention)
 * 3. Stage must be active, request must be pending
 *
 * Atomicity: uses findOneAndUpdate with status:'active' to prevent race conditions.
 * If two pool members approve simultaneously, exactly one succeeds.
 *
 * @param {string} stageInstanceId
 * @param {string} userId - Acting user
 * @param {string} action - 'approve' | 'reject' | 'request_changes'
 * @param {string|null} comment
 */
async function performAction(stageInstanceId, userId, action, comment = null) {
  // Validate action
  const validActions = ['approve', 'reject', 'request_changes'];
  if (!validActions.includes(action)) {
    throw new AppError('INVALID_ACTION', 400, `Invalid action: ${action}`);
  }

  // Reject requires a reason, request_changes requires a comment
  if (action === 'reject' && (!comment || comment.trim().length === 0)) {
    throw new AppError('VALIDATION_ERROR', 400, 'A reason is required when rejecting');
  }
  if (action === 'request_changes' && (!comment || comment.trim().length === 0)) {
    throw new AppError('VALIDATION_ERROR', 400, 'A comment is required when requesting changes');
  }

  // Load stage instance
  const instance = await StageInstance.findById(stageInstanceId);
  if (!instance) {
    throw new AppError('NOT_FOUND', 404, 'Stage instance not found');
  }
  if (instance.status !== 'active') {
    throw new AppError('ALREADY_ACTIONED', 409, 'This stage has already been actioned or is not active');
  }

  // Load request
  const request = await Request.findById(instance.requestId);
  if (!request) {
    throw new AppError('NOT_FOUND', 404, 'Request not found');
  }
  if (request.status !== 'pending') {
    throw new AppError('INVALID_TRANSITION', 409, 'Request is not in a pending state');
  }

  // Self-approval prevention: requester can never act on their own request
  if (request.requesterId.equals(userId)) {
    throw new AppError('SELF_APPROVAL', 403, 'You cannot approve, reject, or request changes on your own request');
  }

  // Authorization: check if user is assigned, escalated to, or delegated
  const isAssigned = instance.assignedTo.some((id) => id.equals(userId));
  const isEscalated = instance.escalatedTo.some((id) => id.equals(userId));
  let delegation = null;
  let onBehalfOf = null;

  if (!isAssigned && !isEscalated) {
    // Check for active delegation
    delegation = await findActiveDelegation(
      userId,
      instance.assignedTo,
      instance.escalatedTo,
      request.workflowId
    );

    if (!delegation) {
      throw new AppError('FORBIDDEN', 403, 'You are not authorized to act on this stage');
    }

    onBehalfOf = delegation.delegatorId;
  }

  // Map action to stage status
  const statusMap = {
    approve: 'approved',
    reject: 'rejected',
    request_changes: 'changes_requested',
  };

  // Atomic update: only succeeds if stage is still active (prevents race conditions)
  const updated = await StageInstance.findOneAndUpdate(
    { _id: stageInstanceId, status: 'active' },
    {
      $set: {
        status: statusMap[action],
        actedBy: userId,
        onBehalfOf: onBehalfOf,
        actedAt: new Date(),
        comment: comment ? comment.trim() : null,
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new AppError('ALREADY_ACTIONED', 409, 'This stage has already been actioned by another user');
  }

  // Load workflow version for advance logic
  const workflowVersion = await WorkflowVersion.findById(request.workflowVersionId);
  const requester = await User.findById(request.requesterId).populate('departmentId');

  // Record audit
  const auditAction = delegation ? 'delegated_action' : action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes_requested';
  await auditService.record({
    requestId: request._id,
    requestNumber: request.requestNumber,
    actorId: userId,
    onBehalfOfId: onBehalfOf,
    action: auditAction,
    stageKey: instance.stageKey,
    cycle: instance.cycle,
    details: {
      stageName: instance.name,
      comment: comment,
      action,
    },
  });

  // Handle the action outcome
  if (action === 'approve') {
    // Try to advance to the next stage
    const { completed } = await advance(request, requester, workflowVersion);

    if (completed) {
      // All stages done — transition to approved
      const updatedReq = await transitionRequest(request._id, 'pending', 'approved');

      await auditService.record({
        requestId: request._id,
        requestNumber: request.requestNumber,
        actorId: null,
        action: 'completed',
        fromStatus: 'pending',
        toStatus: 'approved',
        cycle: request.cycle,
      });

      // Notify requester
      await notificationService.notify(
        [request.requesterId],
        'completed',
        request._id,
        `Your request ${request.requestNumber} has been approved`,
      );
    }

    // Notify requester of stage approval
    await notificationService.notify(
      [request.requesterId],
      'approved',
      request._id,
      `Stage '${instance.name}' of your request ${request.requestNumber} has been approved`,
    );

  } else if (action === 'reject') {
    // Cancel all other active/waiting instances in this cycle
    await StageInstance.updateMany(
      {
        requestId: request._id,
        cycle: instance.cycle,
        _id: { $ne: stageInstanceId },
        status: { $in: ['active', 'waiting'] },
      },
      { $set: { status: 'cancelled' } }
    );

    // Transition request to rejected
    await transitionRequest(request._id, 'pending', 'rejected');

    // Notify requester
    await notificationService.notify(
      [request.requesterId],
      'rejected',
      request._id,
      `Your request ${request.requestNumber} has been rejected at stage '${instance.name}'`,
    );

  } else if (action === 'request_changes') {
    // Cancel all other active/waiting instances in this cycle
    await StageInstance.updateMany(
      {
        requestId: request._id,
        cycle: instance.cycle,
        _id: { $ne: stageInstanceId },
        status: { $in: ['active', 'waiting'] },
      },
      { $set: { status: 'cancelled' } }
    );

    // Transition request to changes_requested
    await transitionRequest(request._id, 'pending', 'changes_requested');

    // Notify requester
    await notificationService.notify(
      [request.requesterId],
      'changes_requested',
      request._id,
      `Changes requested on your request ${request.requestNumber} at stage '${instance.name}'`,
    );
  }

  return updated;
}

module.exports = { performAction, findActiveDelegation };
