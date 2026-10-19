const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attachmentSchema = new Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', default: null },
    fieldKey: { type: String, default: null },
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('Attachment', attachmentSchema);
