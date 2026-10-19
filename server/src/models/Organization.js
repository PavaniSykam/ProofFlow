const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const organizationSchema = new Schema(
  {
    name: { type: String, required: true },
    settings: {
      defaultSlaHours: { type: Number, default: 48 },
      reminderPercent: { type: Number, default: 75 },
      schedulerIntervalSeconds: { type: Number, default: 60 },
    },
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
