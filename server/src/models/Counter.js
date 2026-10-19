const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Counter collection for atomic request number generation.
 * Pattern: PF-YYYY-NNNN
 */
const counterSchema = new Schema(
  {
    _id: { type: String, required: true }, // e.g. "requestNumber_2026"
    seq: { type: Number, default: 0 },
  },
  { strict: true }
);

/**
 * Atomically increment and return the next sequence number for a given year.
 */
counterSchema.statics.getNextRequestNumber = async function () {
  const year = new Date().getFullYear();
  const counter = await this.findOneAndUpdate(
    { _id: `requestNumber_${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(counter.seq).padStart(4, '0');
  return `PF-${year}-${padded}`;
};

module.exports = mongoose.model('Counter', counterSchema);
