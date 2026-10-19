const Request = require('../models/Request');
const StageInstance = require('../models/StageInstance');
const WorkflowVersion = require('../models/WorkflowVersion');
const Workflow = require('../models/Workflow');
const Counter = require('../models/Counter');
const Organization = require('../models/Organization');
const Attachment = require('../models/Attachment');
const User = require('../models/User');
const { validateFormData } = require('./validateFormData');
const { resolveAssignees } = require('./resolveAssignees');
const { transitionRequest } = require('./transitions');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Evaluate a stage condition against form data.
 * Returns true if the stage should be included, false if it should be skipped.
 */
function evaluateCondition(condition, formData) {
  if (!condition || !condition.fieldKey) return true;

  const fieldValue = formData[condition.fieldKey];
  const condValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return fieldValue == condValue;
    case 'neq':
      return fieldValue != condValue;
    case 'gt':
      return Number(fieldValue) > Number(condValue);
    case 'gte':
      return Number(fieldValue) >= Number(condValue);
    case 'lt':
      return Number(fieldValue) < Number(condValue);
    case 'lte':
      return Number(fieldValue) <= Number(condValue);
    default:
      return true;
  }
}

/**
 * Submit a draft request.
 *
 * 1. Verify status is draft and requester owns it
 * 2. Load the pinned WorkflowVersion
 * 3. Validate formData and attachments against field definitions
 * 4. Create StageInstances for every applicable stage
 * 5. Activate the first group: resolve assignees, set deadlines
 * 6. Transition draft → pending
 * 7. Write audit and notify assignees
 */
async function submitRequest(requestId, userId) {
  const request = await Request.findById(requestId);
  if (!request) {
    throw new AppError('NOT_FOUND', 404, 'Request not found');
  }
  if (!request.requesterId.equals(userId)) {
    throw new AppError('FORBIDDEN', 403, 'You can only submit your own requests');
  }
  if (request.status !== 'draft') {
    throw new AppError('INVALID_TRANSITION', 409, 'Only draft requests can be submitted');
  }

  // Load the pinned workflow version
  const workflowVersion = await WorkflowVersion.findById(request.workflowVersionId);
  if (!workflowVersion) {
    throw new AppError('NOT_FOUND', 404, 'Workflow version not found');
  }

  // Load requester with department
  const requester = await User.findById(userId).populate('departmentId');
  if (!requester) {
    throw new AppError('NOT_FOUND', 404, 'User not found');
  }

  // Load attachments for this request
  const attachments = await Attachment.find({ requestId: request._id });

  // Validate form data against the workflow version field definitions
  const { validatedData, errors } = validateFormData(
    request.formData || {},
    workflowVersion.fields,
    attachments
  );

  if (errors.length > 0) {
    throw new AppError('VALIDATION_ERROR', 422, 'Form validation failed', errors);
  }

  // Create stage instances for applicable stages
  const applicableStages = workflowVersion.stages.filter((stage) =>
    evaluateCondition(stage.condition, validatedData)
  );

  if (applicableStages.length === 0) {
    throw new AppError('INVALID_REQUEST', 422, 'No applicable approval stages for this submission');
  }

  const stageInstances = applicableStages.map((stage) => ({
    requestId: request._id,
    cycle: request.cycle,
    stageKey: stage.key,
    name: stage.name,
    order: stage.order,
    status: 'waiting',
    assignedTo: [],
    escalatedTo: [],
    escalationLevel: 0,
  }));

  await StageInstance.insertMany(stageInstances);

  // Find the first group (lowest order)
  const firstGroupOrder = Math.min(...applicableStages.map((s) => s.order));
  const firstGroupStages = applicableStages.filter((s) => s.order === firstGroupOrder);

  // Get org settings for default SLA
  const org = await Organization.findOne();
  const defaultSlaHours = org?.settings?.defaultSlaHours || 48;

  // Activate first group instances
  const allAssignees = [];
  let anyNeedsAdmin = false;

  for (const stageDef of firstGroupStages) {
    const { assignees, needsAdminAttention } = await resolveAssignees(stageDef, request, requester);

    const slaHours = stageDef.slaHours || defaultSlaHours;
    const activatedAt = new Date();
    const dueAt = new Date(activatedAt.getTime() + slaHours * 60 * 60 * 1000);

    await StageInstance.findOneAndUpdate(
      { requestId: request._id, cycle: request.cycle, stageKey: stageDef.key, status: 'waiting' },
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
    if (needsAdminAttention) anyNeedsAdmin = true;

    // Audit: stage activated
    await auditService.record({
      requestId: request._id,
      requestNumber: request.requestNumber,
      actorId: null,
      action: 'stage_activated',
      stageKey: stageDef.key,
      cycle: request.cycle,
      details: { stageName: stageDef.name, assignedTo: assignees, needsAdminAttention },
    });
  }

  // Transition draft → pending
  const updatedRequest = await transitionRequest(request._id, 'draft', 'pending', {
    formData: validatedData,
    departmentId: requester.departmentId?._id || requester.departmentId,
    submittedAt: new Date(),
    currentGroupOrder: firstGroupOrder,
  });

  // Audit: submitted
  await auditService.record({
    requestId: request._id,
    requestNumber: request.requestNumber,
    actorId: userId,
    action: 'submitted',
    fromStatus: 'draft',
    toStatus: 'pending',
    cycle: request.cycle,
  });

  // Notify assignees
  const uniqueAssignees = [...new Set(allAssignees.map((a) => a.toString()))];
  if (uniqueAssignees.length > 0) {
    await notificationService.notify(
      uniqueAssignees,
      'approval_required',
      request._id,
      `New request ${request.requestNumber} requires your approval`,
      `submit_notify:${request._id}:${request.cycle}`
    );
  }

  // Notify admins if needed
  if (anyNeedsAdmin) {
    const admins = await User.find({ roles: 'admin', isActive: true }).select('_id');
    const adminIds = admins.map((a) => a._id);
    if (adminIds.length > 0) {
      await notificationService.notify(
        adminIds,
        'needs_admin_attention',
        request._id,
        `Request ${request.requestNumber} has a stage with no valid assignee`,
        `needs_admin_submit:${request._id}`
      );
    }
  }

  return updatedRequest;
}

module.exports = { submitRequest, evaluateCondition };
