const AppError = require('../utils/AppError');

/**
 * Validate form data submitted by a user against the field definitions
 * from the pinned WorkflowVersion.
 *
 * Server-side validation: required, type, min/max, string lengths,
 * dropdown option membership, date parsing, checkbox as boolean,
 * file rules, and reject keys not defined in the workflow.
 *
 * @param {Object} formData - The submitted form data
 * @param {Array}  fieldDefs - The field definitions from WorkflowVersion
 * @param {Array}  attachments - The attachment documents bound to this request
 * @returns {{ validatedData: Object, errors: Array }}
 */
function validateFormData(formData, fieldDefs, attachments = []) {
  const errors = [];
  const validatedData = {};
  const definedKeys = new Set(fieldDefs.map((f) => f.key));

  // Reject unknown keys (keys not defined in the workflow)
  for (const key of Object.keys(formData)) {
    if (!definedKeys.has(key)) {
      errors.push({ field: key, message: `Unknown field '${key}' is not defined in this workflow` });
    }
  }

  for (const field of fieldDefs) {
    const value = formData[field.key];
    const hasValue = value !== undefined && value !== null && value !== '';

    // File fields are validated separately via attachments
    if (field.type === 'file') {
      const fieldAttachments = attachments.filter((a) => a.fieldKey === field.key);
      if (field.required && fieldAttachments.length === 0) {
        errors.push({ field: field.key, message: `${field.label} is required` });
      }
      if (field.file?.maxFiles && fieldAttachments.length > field.file.maxFiles) {
        errors.push({
          field: field.key,
          message: `${field.label} allows at most ${field.file.maxFiles} file(s)`,
        });
      }
      continue;
    }

    // Required check
    if (field.required && !hasValue) {
      errors.push({ field: field.key, message: `${field.label} is required` });
      continue;
    }

    // Skip further validation if the field is empty and not required
    if (!hasValue) {
      continue;
    }

    // Type-specific validation
    switch (field.type) {
      case 'text': {
        if (typeof value !== 'string') {
          errors.push({ field: field.key, message: `${field.label} must be text` });
          break;
        }
        if (field.minLength && value.length < field.minLength) {
          errors.push({
            field: field.key,
            message: `${field.label} must be at least ${field.minLength} characters`,
          });
        }
        if (field.maxLength && value.length > field.maxLength) {
          errors.push({
            field: field.key,
            message: `${field.label} must be at most ${field.maxLength} characters`,
          });
        }
        validatedData[field.key] = value.trim();
        break;
      }

      case 'textarea': {
        if (typeof value !== 'string') {
          errors.push({ field: field.key, message: `${field.label} must be text` });
          break;
        }
        if (field.minLength && value.length < field.minLength) {
          errors.push({
            field: field.key,
            message: `${field.label} must be at least ${field.minLength} characters`,
          });
        }
        if (field.maxLength && value.length > field.maxLength) {
          errors.push({
            field: field.key,
            message: `${field.label} must be at most ${field.maxLength} characters`,
          });
        }
        validatedData[field.key] = value.trim();
        break;
      }

      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push({ field: field.key, message: `${field.label} must be a number` });
          break;
        }
        if (field.min !== null && field.min !== undefined && num < field.min) {
          errors.push({
            field: field.key,
            message: `${field.label} must be at least ${field.min}`,
          });
        }
        if (field.max !== null && field.max !== undefined && num > field.max) {
          errors.push({
            field: field.key,
            message: `${field.label} must be at most ${field.max}`,
          });
        }
        validatedData[field.key] = num;
        break;
      }

      case 'date': {
        const dateVal = new Date(value);
        if (isNaN(dateVal.getTime())) {
          errors.push({ field: field.key, message: `${field.label} must be a valid date` });
          break;
        }
        validatedData[field.key] = dateVal.toISOString();
        break;
      }

      case 'dropdown': {
        if (!field.options || !field.options.includes(value)) {
          errors.push({
            field: field.key,
            message: `${field.label} must be one of: ${(field.options || []).join(', ')}`,
          });
          break;
        }
        validatedData[field.key] = value;
        break;
      }

      case 'checkbox': {
        if (typeof value !== 'boolean') {
          errors.push({ field: field.key, message: `${field.label} must be true or false` });
          break;
        }
        validatedData[field.key] = value;
        break;
      }

      default:
        errors.push({ field: field.key, message: `Unknown field type '${field.type}'` });
    }
  }

  return { validatedData: errors.length === 0 ? validatedData : formData, errors };
}

module.exports = { validateFormData };
