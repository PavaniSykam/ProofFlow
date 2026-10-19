const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Records admin configuration changes (user, department, role edits)
 * for audit purposes. Append-only.
 */
const adminChangeLogSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    entityType: {
      type: String,
      required: true,
      immutable: true,
      enum: ['user', 'department', 'role', 'workflow', 'stage_reassignment'],
    },
    entityId: { type: Schema.Types.ObjectId, required: true, immutable: true },
    action: { type: String, required: true, immutable: true },
    changes: { type: Schema.Types.Mixed, immutable: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    strict: true,
  }
);

adminChangeLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('AdminChangeLog', adminChangeLogSchema);
