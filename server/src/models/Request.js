const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestSchema = new Schema(
  {
    requestNumber: { type: String, unique: true, required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow', required: true },
    workflowVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowVersion',
      required: true,
    },
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' }, // snapshot at submission
    status: {
      type: String,
      required: true,
      enum: ['draft', 'pending', 'approved', 'rejected', 'changes_requested', 'cancelled'],
      default: 'draft',
    },
    cycle: { type: Number, default: 1 },
    formData: { type: Schema.Types.Mixed, default: {} },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }],
    currentGroupOrder: { type: Number, default: null },
    submittedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    rev: { type: Number, default: 0 }, // optimistic concurrency
  },
  { timestamps: true, strict: true }
);

requestSchema.index({ requesterId: 1, status: 1 });
requestSchema.index({ status: 1, updatedAt: 1 });
requestSchema.index({ requestNumber: 1 });

module.exports = mongoose.model('Request', requestSchema);
