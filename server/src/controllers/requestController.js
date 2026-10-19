const requestService = require('../services/requestService');
const storageService = require('../services/storageService');
const Request = require('../models/Request');
const Attachment = require('../models/Attachment');
const AppError = require('../utils/AppError');
const fs = require('fs');

const createDraft = async (req, res) => {
  const request = await requestService.createDraft(req.body, req.user);
  res.status(201).json({ request });
};

const updateDraft = async (req, res) => {
  const request = await requestService.updateDraft(req.params.id, req.body.formData, req.user);
  res.json({ request });
};

const submit = async (req, res) => {
  const request = await requestService.submit(req.params.id, req.user);
  res.json({ request, message: 'Request submitted successfully' });
};

const resubmit = async (req, res) => {
  const request = await requestService.resubmit(req.params.id, req.body?.formData || {}, req.user);
  res.json({ request, message: 'Request resubmitted successfully' });
};

const cancel = async (req, res) => {
  const request = await requestService.cancel(req.params.id, req.user);
  res.json({ request, message: 'Request cancelled' });
};

const deleteDraft = async (req, res) => {
  const result = await requestService.deleteDraft(req.params.id, req.user);
  res.json(result);
};

const getMine = async (req, res) => {
  const data = await requestService.getMine(req.user._id, req.query);
  res.json(data);
};

const getById = async (req, res) => {
  const data = await requestService.getById(req.params.id, req.user);
  res.json(data);
};

const getAudit = async (req, res) => {
  const auditLogs = await requestService.getAuditLogs(req.params.id, req.user);
  res.json({ auditLogs });
};

const uploadAttachment = async (req, res) => {
  if (!req.file) {
    throw new AppError('VALIDATION_ERROR', 400, 'No file was uploaded');
  }

  const requestId = req.params.id;
  const request = await Request.findById(requestId);
  if (!request) {
    throw new AppError('NOT_FOUND', 404, 'Request not found');
  }

  if (!request.requesterId.equals(req.user._id)) {
    throw new AppError('FORBIDDEN', 403, 'You can only upload files to your own requests');
  }

  if (!['draft', 'changes_requested'].includes(request.status)) {
    throw new AppError('INVALID_STATE', 409, 'Files can only be added to drafts or when changes are requested');
  }

  const attachment = await storageService.saveAttachment({
    file: req.file,
    uploadedBy: req.user._id,
    requestId: request._id,
    fieldKey: req.body?.fieldKey || null,
  });

  request.attachments.push(attachment._id);
  await request.save();

  res.status(201).json({ attachment });
};

const downloadAttachment = async (req, res) => {
  const attachment = await storageService.getAttachmentById(req.params.id);

  if (attachment.requestId) {
    const request = await Request.findById(attachment.requestId);
    if (!request) {
      throw new AppError('NOT_FOUND', 404, 'Associated request not found');
    }
    const { authorized } = await requestService.checkViewAuthorization(
      request,
      req.user._id,
      req.user.roles
    );
    if (!authorized) {
      // 404 per security requirements
      throw new AppError('NOT_FOUND', 404, 'Attachment not found');
    }
  } else if (!attachment.uploadedBy.equals(req.user._id) && !req.user.roles.includes('admin')) {
    throw new AppError('NOT_FOUND', 404, 'Attachment not found');
  }

  const filePath = storageService.getFilePath(attachment.storedName);
  if (!fs.existsSync(filePath)) {
    throw new AppError('NOT_FOUND', 404, 'File not found on server');
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.originalName)}"`);
  res.setHeader('Content-Type', attachment.mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
};

const deleteAttachment = async (req, res) => {
  const result = await storageService.deleteAttachment(
    req.params.id,
    req.user._id,
    req.user.roles
  );
  res.json(result);
};

module.exports = {
  createDraft,
  updateDraft,
  submit,
  resubmit,
  cancel,
  deleteDraft,
  getMine,
  getById,
  getAudit,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
};
