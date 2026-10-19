const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const workflowSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z][a-z0-9_-]*$/,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    isActive: { type: Boolean, default: false },
    currentVersion: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    allowedSubmitterRoles: [{ type: String }], // empty = everyone
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('Workflow', workflowSchema);
