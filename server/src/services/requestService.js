const Request = require('../models/Request');
const StageInstance = require('../models/StageInstance');
const Workflow = require('../models/Workflow');
const WorkflowVersion = require('../models/WorkflowVersion');
const Attachment = require('../models/Attachment');
const Delegation = require('../models/Delegation');
const AuditLog = require('../models/AuditLog');
const Counter = require('../models/Counter');
const { submitRequest } = require('../engine/submit');
const { resubmitRequest } = require('../engine/resubmit');
const { cancelRequest } = require('../engine/cancel');
const auditService = require('./auditService');
const AppError = require('../utils/AppError');
const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const logger = require('../utils/logger');

class RequestService {
  async createDraft({ workflowId, formData = {} }, user) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow || !workflow.isActive) {
      throw new AppError('NOT_FOUND', 404, 'Workflow not found or is inactive');
    }

    // Role check if allowedSubmitterRoles specified
    if (workflow.allowedSubmitterRoles && workflow.allowedSubmitterRoles.length > 0) {
      const hasRole = workflow.allowedSubmitterRoles.some((r) => user.roles.includes(r));
      if (!hasRole) {
        throw new AppError('FORBIDDEN', 403, 'You are not authorized to submit requests for this workflow');
      }
    }

    const pinnedVersion = await WorkflowVersion.findOne({
      workflowId: workflow._id,
      version: workflow.currentVersion,
    });
    if (!pinnedVersion) {
      throw new AppError('NOT_FOUND', 404, 'Workflow version definition not found');
    }

    const requestNumber = await Counter.getNextRequestNumber();

    const request = new Request({
      requestNumber,
      workflowId: workflow._id,
      workflowVersionId: pinnedVersion._id,
      requesterId: user._id,
      departmentId: user.departmentId || null,
      status: 'draft',
      cycle: 1,
      formData,
      attachments: [],
    });
    await request.save();

    await auditService.record({
      requestId: request._id,
      requestNumber: request.requestNumber,
      actorId: user._id,
      action: 'draft_created',
      fromStatus: null,
      toStatus: 'draft',
      cycle: 1,
      details: { workflowName: workflow.name },
    });

    return request;
  }

  async updateDraft(requestId, formData, user) {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new AppError('NOT_FOUND', 404, 'Request not found');
    }

    if (!request.requesterId.equals(user._id)) {
      throw new AppError('FORBIDDEN', 403, 'You do not own this request');
    }

    if (!['draft', 'changes_requested'].includes(request.status)) {
      throw new AppError('INVALID_STATE', 409, 'Only draft or changes_requested requests can be edited');
    }

    request.formData = { ...request.formData, ...formData };
    await request.save();
    return request;
  }

  async submit(requestId, user) {
    return submitRequest(requestId, user._id);
  }

  async resubmit(requestId, formData, user) {
    return resubmitRequest(requestId, user._id, formData);
  }

  async cancel(requestId, user) {
    return cancelRequest(requestId, user._id);
  }

  async deleteDraft(requestId, user) {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new AppError('NOT_FOUND', 404, 'Request not found');
    }

    if (!request.requesterId.equals(user._id)) {
      throw new AppError('FORBIDDEN', 403, 'You can only delete your own draft requests');
    }

    if (request.status !== 'draft') {
      throw new AppError('INVALID_STATE', 409, 'Only draft requests can be deleted');
    }

    // Clean up uploaded files
    const attachments = await Attachment.find({ requestId: request._id });
    const uploadDir = path.resolve(config.uploadDir);
    for (const att of attachments) {
      const filePath = path.join(uploadDir, att.storedName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          logger.error(`Failed to delete draft attachment file: ${filePath}`, err);
        }
      }
    }
    await Attachment.deleteMany({ requestId: request._id });

    await auditService.record({
      requestId: request._id,
      requestNumber: request.requestNumber,
      actorId: user._id,
      action: 'draft_deleted',
      fromStatus: 'draft',
      toStatus: null,
      cycle: request.cycle,
    });

    await Request.findByIdAndDelete(requestId);
    return { success: true };
  }

  async getMine(userId, query = {}) {
    const filter = { requesterId: userId };
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search) {
      filter.requestNumber = new RegExp(query.search, 'i');
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .populate('workflowId', 'name key')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Request.countDocuments(filter),
    ]);

    // Attach active stage names
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const activeStages = await StageInstance.find({
          requestId: req._id,
          cycle: req.cycle,
          status: 'active',
        }).select('name dueAt assignedTo');

        const isOverdue = activeStages.some((s) => s.dueAt && new Date(s.dueAt) < new Date());

        return {
          ...req,
          activeStages,
          isOverdue,
        };
      })
    );

    return {
      requests: enriched,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Object-level authorization check.
   * Returns { authorized: boolean, isAdminReadOnly: boolean }
   */
  async checkViewAuthorization(request, userId, userRoles = []) {
    // 1. Requester
    if (request.requesterId.equals(userId)) {
      return { authorized: true, isAdminReadOnly: false };
    }

    // 2. Present or past assignee of any stage of this request
    const stageInstances = await StageInstance.find({ requestId: request._id }).lean();
    const isAssignee = stageInstances.some(
      (s) =>
        (s.assignedTo && s.assignedTo.some((id) => id.toString() === userId.toString())) ||
        (s.escalatedTo && s.escalatedTo.some((id) => id.toString() === userId.toString())) ||
        (s.actedBy && s.actedBy.toString() === userId.toString())
    );
    if (isAssignee) {
      return { authorized: true, isAdminReadOnly: false };
    }

    // 3. Active delegate of an assigned/escalated user
    const now = new Date();
    const activeAssigneeIds = [];
    stageInstances
      .filter((s) => s.status === 'active')
      .forEach((s) => {
        if (s.assignedTo) s.assignedTo.forEach((id) => activeAssigneeIds.push(id.toString()));
        if (s.escalatedTo) s.escalatedTo.forEach((id) => activeAssigneeIds.push(id.toString()));
      });

    if (activeAssigneeIds.length > 0) {
      const delegation = await Delegation.findOne({
        delegateId: userId,
        delegatorId: { $in: activeAssigneeIds },
        startsAt: { $lte: now },
        endsAt: { $gte: now },
        revokedAt: null,
        $or: [{ workflowIds: { $size: 0 } }, { workflowIds: request.workflowId }],
      });
      if (delegation) {
        return { authorized: true, isAdminReadOnly: false };
      }
    }

    // 4. Admin read-only access (audited)
    if (userRoles.includes('admin')) {
      return { authorized: true, isAdminReadOnly: true };
    }

    return { authorized: false, isAdminReadOnly: false };
  }

  async getById(requestId, user) {
    const request = await Request.findById(requestId)
      .populate('workflowId', 'name key description')
      .populate('workflowVersionId')
      .populate('requesterId', 'name email departmentId')
      .populate('departmentId', 'name code')
      .populate('attachments');

    if (!request) {
      throw new AppError('NOT_FOUND', 404, 'Request not found');
    }

    const { authorized, isAdminReadOnly } = await this.checkViewAuthorization(
      request,
      user._id,
      user.roles
    );

    if (!authorized) {
      // Must return 404 per security spec to prevent leaking existence
      throw new AppError('NOT_FOUND', 404, 'Request not found');
    }

    // If admin viewed someone else's request, audit it
    if (isAdminReadOnly) {
      await auditService.record({
        requestId: request._id,
        requestNumber: request.requestNumber,
        actorId: user._id,
        action: 'admin_viewed',
        fromStatus: request.status,
        toStatus: request.status,
        cycle: request.cycle,
        details: { adminEmail: user.email },
      });
    }

    // Fetch all stage instances for this request
    const stages = await StageInstance.find({ requestId: request._id })
      .populate('assignedTo', 'name email roles')
      .populate('escalatedTo', 'name email roles')
      .populate('actedBy', 'name email')
      .populate('onBehalfOf', 'name email')
      .sort({ cycle: 1, order: 1 })
      .lean();

    const now = new Date();
    const enrichedStages = stages.map((s) => ({
      ...s,
      isOverdue: s.status === 'active' && s.dueAt && new Date(s.dueAt) < now,
    }));

    return {
      request,
      stages: enrichedStages,
      isAdminReadOnly,
    };
  }

  async getAuditLogs(requestId, user) {
    const request = await Request.findById(requestId);
    if (!request) {
      throw new AppError('NOT_FOUND', 404, 'Request not found');
    }

    const { authorized } = await this.checkViewAuthorization(request, user._id, user.roles);
    if (!authorized) {
      throw new AppError('NOT_FOUND', 404, 'Request not found');
    }

    const logs = await AuditLog.find({ requestId })
      .populate('actorId', 'name email')
      .populate('onBehalfOfId', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    return logs;
  }
}

module.exports = new RequestService();
