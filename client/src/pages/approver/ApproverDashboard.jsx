import React, { useState, useEffect } from 'react';
import { getApproverDashboard } from '../../api/dashboard';
import { useNavigate, Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Inbox, Clock, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ApproverDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getApproverDashboard();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading approver dashboard..." />;

  const stats = data?.stats || {};
  const urgent = data?.urgentItems || [];
  const processed = data?.recentProcessed || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Approver Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review and action requests waiting for your authorization or delegation.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/approver/inbox?tab=waiting')}
          className="bg-white p-6 rounded-xl border border-slate-200 hover:border-amber-400 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Waiting for Me</span>
            <Inbox className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.waiting || 0}</div>
          <span className="text-xs text-amber-600 font-medium mt-1 block">Needs review</span>
        </div>

        <div
          onClick={() => navigate('/approver/inbox?tab=overdue')}
          className="bg-white p-6 rounded-xl border border-slate-200 hover:border-rose-400 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600">{stats.overdue || 0}</div>
          <span className="text-xs text-rose-600 font-medium mt-1 block">Past SLA deadline</span>
        </div>

        <div
          onClick={() => navigate('/approver/inbox?tab=processed')}
          className="bg-white p-6 rounded-xl border border-slate-200 hover:border-emerald-400 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Processed</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{stats.processed || 0}</div>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">Actioned history</span>
        </div>
      </div>

      {/* Urgent Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Urgent Pending Approvals</h3>
          </div>
          <Link to="/approver/inbox" className="text-xs font-semibold text-brand-600 hover:text-brand-800">
            Open Inbox →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {urgent.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No urgent items pending. Your inbox is completely clear!
            </div>
          ) : (
            urgent.map((inst) => {
              const req = inst.requestId;
              const isOverdue = inst.dueAt && new Date(inst.dueAt) < new Date();

              return (
                <div
                  key={inst._id}
                  onClick={() => navigate(`/requests/${req._id}`)}
                  className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                        {req.requestNumber}
                      </span>
                      <span className="font-semibold text-sm text-slate-900">
                        {req.workflowId?.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded">
                        {inst.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Requester: <strong className="text-slate-700">{req.requesterId?.name}</strong> •{' '}
                      Due: {inst.dueAt ? new Date(inst.dueAt).toLocaleDateString() : 'No SLA'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isOverdue && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-rose-600 text-white rounded-full animate-pulse">
                        Overdue
                      </span>
                    )}
                    <span className="px-3 py-1 bg-brand-600 text-white rounded-lg text-xs font-semibold">
                      Review
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
