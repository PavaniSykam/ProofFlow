const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-schema for field definitions within a workflow version
const fieldSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['text', 'textarea', 'number', 'date', 'dropdown', 'checkbox', 'file'],
    },
    required: { type: Boolean, default: false },
    helpText: { type: String, default: '' },
    options: [{ type: String }], // for dropdown
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    minLength: { type: Number, default: null },
    maxLength: { type: Number, default: null },
    file: {
      allowedTypes: [{ type: String }],
      maxSizeMB: { type: Number, default: 5 },
      maxFiles: { type: Number, default: 1 },
    },
    order: { type: Number, required: true },
  },
  { _id: false, strict: true }
);

// Sub-schema for escalation configuration
const escalationSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    afterHoursOverdue: { type: Number, default: 24 },
    action: { type: String, enum: ['reassign'], default: 'reassign' },
    target: {
      type: { type: String, enum: ['manager_of_approver', 'role', 'user'] },
      roleKey: { type: String },
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    nextSlaHours: { type: Number, default: 24 },
    maxLevels: { type: Number, default: 2 },
  },
  { _id: false, strict: true }
);

// Sub-schema for condition on a stage
const conditionSchema = new Schema(
  {
    fieldKey: { type: String },
    operator: { type: String, enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'] },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false, strict: true }
);

// Sub-schema for stage definitions within a workflow version
const stageSchema = new Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    order: { type: Number, required: true }, // same order = parallel group
    approver: {
      type: {
        type: String,
        required: true,
        enum: [
          'reporting_manager',
          'department_head',
          'role',
          'user',
          'REPORTING_MANAGER',
          'DEPARTMENT_HEAD',
          'ROLE',
          'SPECIFIC_USER',
        ],
      },
      roleKey: { type: String },
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      sameDepartmentAsRequester: { type: Boolean, default: false },
    },
    slaHours: { type: Number, default: null },
    reminderPercent: { type: Number, default: null },
    escalation: escalationSchema,
    locksCancellation: { type: Boolean, default: false },
    condition: conditionSchema,
  },
  { _id: false, strict: true }
);

const workflowVersionSchema = new Schema(
  {
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
    },
    version: { type: Number, required: true },
    fields: [fieldSchema],
    stages: [stageSchema],
    settings: {
      allowCancel: { type: Boolean, default: true },
      resubmitMode: { type: String, enum: ['restart'], default: 'restart' },
    },
    publishedAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, strict: true }
);

// Unique index: one version number per workflow
workflowVersionSchema.index({ workflowId: 1, version: 1 }, { unique: true });

// Immutability: block updates on published versions
workflowVersionSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function () {
  throw new Error('WorkflowVersion documents are immutable after creation');
});

module.exports = mongoose.model('WorkflowVersion', workflowVersionSchema);
