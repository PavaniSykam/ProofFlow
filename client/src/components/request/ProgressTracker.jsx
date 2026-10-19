import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function ProgressTracker({ stages = [] }) {
  if (!stages || stages.length === 0) return null;

  // Group stages by order to show parallel stages side-by-side
  const orderGroups = {};
  stages.forEach((s) => {
    if (!orderGroups[s.order]) orderGroups[s.order] = [];
    orderGroups[s.order].push(s);
  });

  const sortedOrders = Object.keys(orderGroups).sort((a, b) => Number(a) - Number(b));

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'changes_requested':
        return <AlertCircle className="w-5 h-5 text-purple-500" />;
      case 'active':
        return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-slate-400" />;
      default:
        return <div className="w-3.5 h-3.5 rounded-full bg-slate-300" />;
    }
  };

  const getCardBorder = (status, isOverdue) => {
    if (isOverdue) return 'border-rose-400 bg-rose-50/50';
    switch (status) {
      case 'approved':
        return 'border-emerald-200 bg-emerald-50/30';
      case 'rejected':
        return 'border-rose-200 bg-rose-50/30';
      case 'changes_requested':
        return 'border-purple-200 bg-purple-50/30';
      case 'active':
        return 'border-amber-300 bg-amber-50/40 shadow-sm';
      default:
        return 'border-slate-200 bg-slate-50/50 opacity-75';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
      <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-5">
        Approval Stage Tracker
      </h3>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 overflow-x-auto pb-2">
        {sortedOrders.map((order, idx) => {
          const group = orderGroups[order];
          const isParallel = group.length > 1;

          return (
            <React.Fragment key={order}>
              <div
                className={`flex-1 min-w-[200px] flex ${
                  isParallel ? 'flex-col gap-2' : 'flex-col'
                }`}
              >
                {group.map((stage) => {
                  const assignees = stage.assignedTo?.map((u) => u.name).join(', ') || 'Unassigned';
                  const isActed = ['approved', 'rejected', 'changes_requested'].includes(stage.status);

                  return (
                    <div
                      key={stage._id || stage.stageKey}
                      className={`p-3.5 rounded-xl border ${getCardBorder(
                        stage.status,
                        stage.isOverdue
                      )} transition-all`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-500 uppercase">
                          Stage {stage.order}
                        </span>
                        {getStatusIcon(stage.status)}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {stage.name}
                      </h4>

                      <div className="mt-2 text-xs text-slate-600">
                        {isActed ? (
                          <>
                            <span className="text-slate-400">Acted by: </span>
                            <span className="font-medium text-slate-800">
                              {stage.actedBy?.name || 'Authorized Approver'}
                            </span>
                            {stage.comment && (
                              <p className="mt-1 italic text-slate-600 text-[11px] bg-white/70 p-1.5 rounded border border-slate-100">
                                "{stage.comment}"
                              </p>
                            )}
                          </>
                        ) : stage.status === 'active' ? (
                          <>
                            <span className="text-slate-400">Assigned: </span>
                            <span className="font-semibold text-slate-800">{assignees}</span>
                            {stage.dueAt && (
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-[11px] text-slate-500">
                                  Due: {new Date(stage.dueAt).toLocaleDateString()}
                                </span>
                                {stage.isOverdue && (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400">Waiting for prior stages</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {idx < sortedOrders.length - 1 && (
                <div className="hidden md:flex items-center text-slate-300">
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
