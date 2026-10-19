const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Append-only audit log.
 * Immutability enforced via pre hooks that block update/delete operations.
 * Note: application-level immutability is not a substitute for
 * restricting the production DB user to insert/find only on this collection.
 */
const auditLogSchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true, immutable: true },
    requestNumber: { type: String, immutable: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, immutable: true }, // null = system
    onBehalfOfId: { type: Schema.Types.ObjectId, ref: 'User', default: null, immutable: true },
    action: {
      type: String,
      required: true,
      immutable: true,
      enum: [
        'draft_created',
        'draft_deleted',
        'submitted',
        'stage_activated',
        'approved',
        'rejected',
        'changes_requested',
        'resubmitted',
        'cancelled',
        'reminder_sent',
        'marked_overdue',
        'escalated',
        'delegated_action',
        'stage_reassigned',
        'completed',
        'admin_viewed',
        'ai_summary_generated',
      ],
    },
    fromStatus: { type: String, default: null, immutable: true },
    toStatus: { type: String, default: null, immutable: true },
    stageKey: { type: String, default: null, immutable: true },
    cycle: { type: Number, default: null, immutable: true },
    details: { type: Schema.Types.Mixed, default: null, immutable: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
  }
);

// Block all update and delete operations to enforce immutability
const blockMutation = function () {
  throw new Error('AuditLog documents are immutable: updates and deletes are not allowed');
};

auditLogSchema.pre('updateOne', blockMutation);
auditLogSchema.pre('updateMany', blockMutation);
auditLogSchema.pre('findOneAndUpdate', blockMutation);
auditLogSchema.pre('deleteOne', blockMutation);
auditLogSchema.pre('deleteMany', blockMutation);
auditLogSchema.pre('findOneAndDelete', blockMutation);

// Block save on existing documents (only new inserts allowed)
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('AuditLog documents are immutable: updates are not allowed'));
  }
  next();
});

auditLogSchema.index({ requestId: 1, createdAt: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
