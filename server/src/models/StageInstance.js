const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stageInstanceSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    cycle: { type: Number, required: true },
    stageKey: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: [
        'waiting',
        'active',
        'approved',
        'rejected',
        'changes_requested',
        'skipped',
        'cancelled',
        'superseded',
      ],
      default: 'waiting',
    },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    escalatedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    escalationLevel: { type: Number, default: 0 },
    activatedAt: { type: Date, default: null },
    dueAt: { type: Date, default: null },
    reminderSentAt: { type: Date, default: null },
    overdueNotifiedAt: { type: Date, default: null },
    actedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    onBehalfOf: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actedAt: { type: Date, default: null },
    comment: { type: String, default: null },
    needsAdminAttention: { type: Boolean, default: false },
  },
  { timestamps: true, strict: true }
);

stageInstanceSchema.index({ status: 1, assignedTo: 1 });
stageInstanceSchema.index({ status: 1, dueAt: 1 });
stageInstanceSchema.index({ requestId: 1, cycle: 1 });

module.exports = mongoose.model('StageInstance', stageInstanceSchema);
