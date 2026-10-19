const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'approval_required',
        'approved',
        'rejected',
        'changes_requested',
        'resubmitted',
        'sla_reminder',
        'overdue',
        'escalation',
        'completed',
        'cancelled',
        'needs_admin_attention',
        'delegation_received',
        'stage_reassigned',
      ],
    },
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', default: null },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
    dedupeKey: { type: String, default: null },
  },
  { timestamps: true, strict: true }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Notification', notificationSchema);
