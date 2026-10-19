const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roleSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z][a-z0-9_]*$/,
    },
    name: { type: String, required: true, trim: true },
    isApproverRole: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('Role', roleSchema);
