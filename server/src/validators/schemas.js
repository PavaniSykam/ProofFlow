const Joi = require('joi');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = Joi.string().regex(objectIdRegex).message('Invalid ObjectId');

const authSchemas = {
  login: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).required().lowercase().trim(),
    password: Joi.string().required(),
  }),
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),
};

const adminUserSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email({ tlds: { allow: false } }).required().lowercase().trim(),
    password: Joi.string().min(8).optional(),
    roles: Joi.array().items(Joi.string().trim().lowercase()).min(1).required(),
    departmentId: objectId.allow(null).optional(),
    managerId: objectId.allow(null).optional(),
  }),
  update: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    roles: Joi.array().items(Joi.string().trim().lowercase()).min(1).optional(),
    departmentId: objectId.allow(null).optional(),
    managerId: objectId.allow(null).optional(),
    isActive: Joi.boolean().optional(),
    mustChangePassword: Joi.boolean().optional(),
  }),
  resetPassword: Joi.object({
    newPassword: Joi.string().min(8).required(),
  }),
  deactivate: Joi.object({
    confirmPendingReassignment: Joi.boolean().default(true),
  }),
};

const departmentSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    code: Joi.string().trim().min(2).max(10).uppercase().required(),
    headUserId: objectId.allow(null).optional(),
  }),
  update: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    code: Joi.string().trim().min(2).max(10).uppercase().optional(),
    headUserId: objectId.allow(null).optional(),
    isActive: Joi.boolean().optional(),
  }),
};

const roleSchemas = {
  create: Joi.object({
    key: Joi.string().regex(/^[a-z][a-z0-9_]*$/).required(),
    name: Joi.string().trim().min(2).max(50).required(),
    isApproverRole: Joi.boolean().default(false),
  }),
  update: Joi.object({
    name: Joi.string().trim().min(2).max(50).optional(),
    isApproverRole: Joi.boolean().optional(),
  }),
};

const fieldSchema = Joi.object({
  key: Joi.string().required(),
  label: Joi.string().required(),
  type: Joi.string()
    .valid('text', 'textarea', 'number', 'date', 'dropdown', 'checkbox', 'file')
    .required(),
  required: Joi.boolean().default(false),
  helpText: Joi.string().allow('').default(''),
  options: Joi.array().items(Joi.string()).default([]),
  min: Joi.number().allow(null).default(null),
  max: Joi.number().allow(null).default(null),
  minLength: Joi.number().allow(null).default(null),
  maxLength: Joi.number().allow(null).default(null),
  file: Joi.object({
    allowedTypes: Joi.array().items(Joi.string()).default(['.pdf', '.png', '.jpg', '.jpeg']),
    maxSizeMB: Joi.number().default(5),
    maxFiles: Joi.number().default(1),
  }).default(),
  order: Joi.number().required(),
});

const stageSchema = Joi.object({
  key: Joi.string().required(),
  name: Joi.string().required(),
  order: Joi.number().required(),
  approver: Joi.object({
    type: Joi.string()
      .valid(
        'reporting_manager',
        'department_head',
        'role',
        'user',
        'REPORTING_MANAGER',
        'DEPARTMENT_HEAD',
        'ROLE',
        'SPECIFIC_USER'
      )
      .required(),
    roleKey: Joi.string().allow('', null).optional(),
    userId: objectId.allow(null).optional(),
    sameDepartmentAsRequester: Joi.boolean().default(false),
  }).required(),
  slaHours: Joi.number().allow(null).optional(),
  reminderPercent: Joi.number().allow(null).optional(),
  escalation: Joi.object({
    enabled: Joi.boolean().default(false),
    afterHoursOverdue: Joi.number().default(24),
    action: Joi.string().valid('reassign').default('reassign'),
    target: Joi.object({
      type: Joi.string().valid('manager_of_approver', 'role', 'user').required(),
      roleKey: Joi.string().allow('', null).optional(),
      userId: objectId.allow(null).optional(),
    }).optional(),
    nextSlaHours: Joi.number().default(24),
    maxLevels: Joi.number().default(2),
  }).optional(),
  locksCancellation: Joi.boolean().default(false),
  condition: Joi.object({
    fieldKey: Joi.string().required(),
    operator: Joi.string().valid('eq', 'neq', 'gt', 'gte', 'lt', 'lte').required(),
    value: Joi.any().required(),
  }).optional(),
});

const workflowSchemas = {
  create: Joi.object({
    key: Joi.string().regex(/^[a-z][a-z0-9_-]*$/).required(),
    name: Joi.string().trim().min(2).max(100).required(),
    description: Joi.string().allow('').optional(),
    allowedSubmitterRoles: Joi.array().items(Joi.string()).default([]),
    isActive: Joi.boolean().default(true),
    fields: Joi.array().items(fieldSchema).default([]),
    stages: Joi.array().items(stageSchema).default([]),
    settings: Joi.object({
      allowCancel: Joi.boolean().default(true),
      resubmitMode: Joi.string().valid('restart').default('restart'),
    }).default(),
  }),
  update: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    description: Joi.string().allow('').optional(),
    allowedSubmitterRoles: Joi.array().items(Joi.string()).optional(),
    isActive: Joi.boolean().optional(),
    fields: Joi.array().items(fieldSchema).optional(),
    stages: Joi.array().items(stageSchema).optional(),
    settings: Joi.object({
      allowCancel: Joi.boolean().optional(),
      resubmitMode: Joi.string().valid('restart').optional(),
    }).optional(),
  }),
};

const requestSchemas = {
  createDraft: Joi.object({
    workflowId: objectId.required(),
    formData: Joi.object().default({}),
  }),
  updateDraft: Joi.object({
    formData: Joi.object().required(),
  }),
  resubmit: Joi.object({
    formData: Joi.object().optional(),
  }),
};

const approvalSchemas = {
  action: Joi.object({
    comment: Joi.string().allow('', null).optional(),
  }),
  reassign: Joi.object({
    newAssigneeId: objectId.required(),
  }),
};

const delegationSchemas = {
  create: Joi.object({
    delegateId: objectId.required(),
    startsAt: Joi.date().iso().required(),
    endsAt: Joi.date().iso().required(),
    workflowIds: Joi.array().items(objectId).default([]),
  }),
};

module.exports = {
  authSchemas,
  adminUserSchemas,
  departmentSchemas,
  roleSchemas,
  workflowSchemas,
  requestSchemas,
  approvalSchemas,
  delegationSchemas,
  objectId,
};
