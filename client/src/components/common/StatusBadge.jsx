import React from 'react';

const statusConfig = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  pending: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  changes_requested: { label: 'Changes Requested', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' },
};

export default function StatusBadge({ status, isOverdue = false }) {
  const conf = statusConfig[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${conf.bg} ${conf.text} ${conf.border}`}
      >
        {conf.label}
      </span>
      {isOverdue && (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-600 text-white animate-pulse">
          Overdue
        </span>
      )}
    </div>
  );
}
