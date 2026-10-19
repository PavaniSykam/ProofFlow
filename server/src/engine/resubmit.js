const Request = require('../models/Request');
const StageInstance = require('../models/StageInstance');
const WorkflowVersion = require('../models/WorkflowVersion');
const Attachment = require('../models/Attachment');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { validateFormData } = require('./validateFormData');
const { resolveAssignees } = require('./resolveAssignees');
const { transitionRequest } = require('./transitions');
const { evaluateCondition } = require('./submit');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');

/**
 * Resubmit a request after changes were requested.
 *
 * Only from changes_requested, by the requester.
 * - Re-validates form data against the same pinned workflow version
 * - Marks old-cycle instances as superseded (kept for history)
 * - cycle + 1
 * - Creates fresh stage instances from the pinned version
 * - Activates the first group
 * - Transitions to pending
 */
async function resubmitRequest(requestId, userId, newFormData) {
  const request = await Request.findById(requestId);
  if (!request) {
    throw new AppError('NOT_FOUND', 404, 'Request not found');
  }
  if (!request.requesterId.equals(userId)) {
    throw new AppError('FORBIDDEN', 403, 'You can only resubmit your own requests');
  }
  if (request.status !== 'changes_requested') {
    throw new AppError('INVALID_TRANSITION', 409, 'Only requests with changes_requested status can be resubmitted');
  }

  // Load pinned workflow version
  const workflowVersion = await WorkflowVersion.findById(request.workflowVersionId);
  if (!workflowVersion) {
    throw new AppError('NOT_FOUND', 404, 'Workflow version not found');
  }

  const requester = await User.findById(userId).populate('departmentId');
  const attachments = await Attachment.find({ requestId: request._id });

  // Validate the updated form data
  const mergedFormData = { ...request.formData, ...newFormData };
  const { validatedData, errors } = validateFormData(
    mergedFormData,
    workflowVersion.fields,
    attachments
  );

  if (errors.length > 0) {
    throw new AppError('VALIDATION_ERROR', 422, 'Form validation failed', errors);
  }

  // Mark old-cycle instances as superseded
  await StageInstance.updateMany(
    { requestId: request._id, cycle: request.cycle },
    { $set: { status: 'superseded' } }
  );

  const newCycle = request.cycle + 1;

  // Create fresh stage instances from the pinned version
  const applicableStages = workflowVersion.stages.filter((stage) =>
    evaluateCondition(stage.condition, validatedData)
  );

  if (applicableStages.length === 0) {
    throw new AppError('INVALID_REQUEST', 422, 'No applicable approval stages');
  }

  const stageInstances = applicableStages.map((stage) => ({
    requestId: request._id,
    cycle: newCycle,
    stageKey: stage.key,
    name: stage.name,
    order: stage.order,
    status: 'waiting',
    assignedTo: [],
    escalatedTo: [],
    escalationLevel: 0,
  }));

  await StageInstance.insertMany(stageInstances);

  // Activate first group
  const firstGroupOrder = Math.min(...applicableStages.map((s) => s.order));
  const firstGroupStages = applicableStages.filter((s) => s.order === firstGroupOrder);

  const org = await Organization.findOne();
  const defaultSlaHours = org?.settings?.defaultSlaHours || 48;

  const allAssignees = [];

  for (const stageDef of firstGroupStages) {
    const { assignees, needsAdminAttention } = await resolveAssignees(stageDef, request, requester);
    const slaHours = stageDef.slaHours || defaultSlaHours;
    const activatedAt = new Date();
    const dueAt = new Date(activatedAt.getTime() + slaHours * 60 * 60 * 1000);

    await StageInstance.findOneAndUpdate(
      { requestId: request._id, cycle: newCycle, stageKey: stageDef.key, status: 'waiting' },
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

    allAssignees.push(...assignees);

    await auditService.record({
      requestId: request._id,
      requestNumber: request.requestNumber,
      actorId: null,
      action: 'stage_activated',
      stageKey: stageDef.key,
      cycle: newCycle,
      details: { stageName: stageDef.name, assignedTo: assignees, needsAdminAttention },
    });
  }

  // Transition changes_requested → pending
  const updatedRequest = await transitionRequest(request._id, 'changes_requested', 'pending', {
    formData: validatedData,
    cycle: newCycle,
    currentGroupOrder: firstGroupOrder,
    closedAt: null,
  });

  // Audit: resubmitted
  await auditService.record({
    requestId: request._id,
    requestNumber: request.requestNumber,
    actorId: userId,
    action: 'resubmitted',
    fromStatus: 'changes_requested',
    toStatus: 'pending',
    cycle: newCycle,
    details: { previousCycle: request.cycle },
  });

  // Notify first assignees
  const uniqueAssignees = [...new Set(allAssignees.map((a) => a.toString()))];
  if (uniqueAssignees.length > 0) {
    await notificationService.notify(
      uniqueAssignees,
      'resubmitted',
      request._id,
      `Request ${request.requestNumber} has been resubmitted and requires your review`,
      `resubmit_notify:${request._id}:${newCycle}`
    );
  }

  return updatedRequest;
}

module.exports = { resubmitRequest };
