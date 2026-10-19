import React from 'react';
import { History, User, Bot, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const ACTION_LABELS = {
  draft_created: 'Draft Created',
  draft_deleted: 'Draft Deleted',
  submitted: 'Request Submitted',
  stage_activated: 'Stage Activated',
  approved: 'Stage Approved',
  rejected: 'Request Rejected',
  changes_requested: 'Changes Requested',
  resubmitted: 'Request Resubmitted',
  cancelled: 'Request Cancelled',
  reminder_sent: 'SLA Reminder Sent',
  marked_overdue: 'Marked Overdue',
  escalated: 'Stage Escalated',
  delegated_action: 'Action via Delegation',
  stage_reassigned: 'Stage Reassigned by Admin',
  completed: 'Workflow Completed',
  admin_viewed: 'Admin Monitored (Read-Only)',
  ai_summary_generated: 'AI Summary Generated',
};

export default function Timeline({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-sm text-slate-500">
        No audit history recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-brand-600" />
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
          Audit Trail & Timeline
        </h3>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {logs.map((log) => {
          const isSystem = !log.actorId;
          const actorName = isSystem ? 'System Engine' : log.actorId?.name || 'Authorized User';

          return (
            <div key={log._id} className="relative group">
              {/* Dot icon */}
              <div
                className={`absolute -left-[29px] top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] ${
                  log.action.includes('approved') || log.action === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : log.action.includes('rejected')
                    ? 'bg-rose-500 text-white'
                    : log.action.includes('escalated') || log.action.includes('overdue')
                    ? 'bg-amber-500 text-white'
                    : 'bg-brand-500 text-white'
                }`}
              >
                {isSystem ? '•' : '✓'}
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-xs text-slate-800 uppercase tracking-wide">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  {isSystem ? (
                    <Bot className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>
                    Actor: <span className="font-medium text-slate-900">{actorName}</span>
                  </span>
                  {log.onBehalfOfId && (
                    <span className="text-amber-700 font-medium">
                      (on behalf of {log.onBehalfOfId.name})
                    </span>
                  )}
                  {log.cycle && log.cycle > 1 && (
                    <span className="text-slate-400 ml-1">Cycle {log.cycle}</span>
                  )}
                </div>

                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-2 text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                    {log.details.comment && (
                      <p className="italic text-slate-700 mb-1">
                        "{log.details.comment}"
                      </p>
                    )}
                    {log.details.stageName && (
                      <span className="text-[11px] text-slate-500 block">
                        Stage: {log.details.stageName}
                      </span>
                    )}
                    {log.details.newAssigneeName && (
                      <span className="text-[11px] text-brand-600 font-medium block">
                        Reassigned to: {log.details.newAssigneeName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
