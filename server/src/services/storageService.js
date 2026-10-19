const fs = require('fs');
const path = require('path');
const Attachment = require('../models/Attachment');
const Request = require('../models/Request');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class StorageService {
  constructor() {
    this.uploadDir = path.resolve(config.uploadDir);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getFilePath(storedName) {
    if (!storedName || storedName.includes('..') || storedName.includes('/') || storedName.includes('\\')) {
      throw new AppError('INVALID_FILENAME', 400, 'Invalid filename');
    }
    const resolvedPath = path.resolve(this.uploadDir, storedName);
    if (!resolvedPath.startsWith(this.uploadDir)) {
      throw new AppError('SECURITY_ERROR', 403, 'Path traversal detected');
    }
    return resolvedPath;
  }

  async saveAttachment({ file, uploadedBy, requestId = null, fieldKey = null }) {
    const attachment = new Attachment({
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy,
      requestId,
      fieldKey,
    });
    await attachment.save();
    return attachment;
  }

  async getAttachmentById(id) {
    const attachment = await Attachment.findById(id);
    if (!attachment) {
      throw new AppError('NOT_FOUND', 404, 'Attachment not found');
    }
    return attachment;
  }

  async deleteAttachment(id, userId, userRoles = []) {
    const attachment = await Attachment.findById(id);
    if (!attachment) {
      throw new AppError('NOT_FOUND', 404, 'Attachment not found');
    }

    // Only the uploader or admin can delete an attachment
    const isOwner = attachment.uploadedBy.equals(userId);
    const isAdmin = userRoles.includes('admin');
    if (!isOwner && !isAdmin) {
      throw new AppError('FORBIDDEN', 403, 'You do not have permission to delete this attachment');
    }

    // If attached to a request, only allowed in draft or changes_requested status
    if (attachment.requestId) {
      const request = await Request.findById(attachment.requestId);
      if (request && !['draft', 'changes_requested'].includes(request.status)) {
        throw new AppError(
          'INVALID_STATE',
          409,
          'Attachments cannot be deleted from a submitted or closed request'
        );
      }
      if (request) {
        request.attachments = request.attachments.filter((attId) => !attId.equals(attachment._id));
        await request.save();
      }
    }

    // Delete file from disk
    const filePath = this.getFilePath(attachment.storedName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        logger.error(`Failed to delete file ${filePath}:`, err);
      }
    }

    await Attachment.findByIdAndDelete(id);
    return { success: true };
  }
}

module.exports = new StorageService();
