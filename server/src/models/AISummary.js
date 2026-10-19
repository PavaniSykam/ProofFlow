const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const aiSummarySchema = new Schema(
  {
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    cycle: { type: Number, required: true },
    contentHash: { type: String, required: true },
    summary: { type: String, required: true },
    model: { type: String, required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, strict: true }
);

aiSummarySchema.index({ requestId: 1, cycle: 1, contentHash: 1 }, { unique: true });

module.exports = mongoose.model('AISummary', aiSummarySchema);
