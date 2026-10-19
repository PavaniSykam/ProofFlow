import React from 'react';
import FileUploadField from './FileUploadField';

export default function DynamicForm({
  fields = [],
  values = {},
  onChange = () => {},
  requestId = null,
  attachments = [],
  onAttachmentChange = () => {},
  readOnly = false,
  errors = {},
}) {
  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const handleChange = (key, val) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <div className="space-y-5">
      {sortedFields.map((field) => {
        const val = values[field.key] ?? '';
        const fieldError = errors[field.key];

        if (field.type === 'file') {
          return (
            <FileUploadField
              key={field.key}
              requestId={requestId}
              field={field}
              attachments={attachments}
              onAttachmentChange={onAttachmentChange}
              readOnly={readOnly}
            />
          );
        }

        if (readOnly) {
          return (
            <div key={field.key} className="p-3 bg-slate-50/70 rounded-lg border border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                {field.label}
              </span>
              <div className="mt-1 text-sm font-medium text-slate-800 whitespace-pre-wrap">
                {field.type === 'checkbox' ? (val ? 'Yes' : 'No') : val || '—'}
              </div>
            </div>
          );
        }

        return (
          <div key={field.key} className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              {field.label} {field.required && <span className="text-rose-500">*</span>}
            </label>

            {field.type === 'text' && (
              <input
                type="text"
                value={val}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.helpText}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                rows={3}
                value={val}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.helpText}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            )}

            {field.type === 'number' && (
              <input
                type="number"
                min={field.min ?? undefined}
                max={field.max ?? undefined}
                value={val}
                onChange={(e) => handleChange(field.key, e.target.value ? Number(e.target.value) : '')}
                placeholder={field.helpText}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            )}

            {field.type === 'date' && (
              <input
                type="date"
                value={val ? String(val).split('T')[0] : ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            )}

            {field.type === 'dropdown' && (
              <select
                value={val}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              >
                <option value="">Select {field.label}...</option>
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'checkbox' && (
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={Boolean(val)}
                  onChange={(e) => handleChange(field.key, e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700">{field.helpText || field.label}</span>
              </label>
            )}

            {field.helpText && field.type !== 'checkbox' && (
              <p className="text-xs text-slate-500">{field.helpText}</p>
            )}

            {fieldError && <p className="text-xs text-rose-600">{fieldError}</p>}
          </div>
        );
      })}
    </div>
  );
}
