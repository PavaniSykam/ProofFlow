const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const delegationSchema = new Schema(
  {
    delegatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    delegateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    workflowIds: [{ type: Schema.Types.ObjectId, ref: 'Workflow' }], // empty = all
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, strict: true }
);

delegationSchema.index({ delegateId: 1, startsAt: 1, endsAt: 1 });
delegationSchema.index({ delegatorId: 1 });

module.exports = mongoose.model('Delegation', delegationSchema);
