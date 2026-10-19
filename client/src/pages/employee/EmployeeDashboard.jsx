import React, { useState, useEffect } from 'react';
import { getEmployeeDashboard } from '../../api/dashboard';
import { getActiveWorkflows } from '../../api/workflows';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  FilePlus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, wfRes] = await Promise.all([
          getEmployeeDashboard(),
          getActiveWorkflows(),
        ]);
        setData(dashRes.data);
        setWorkflows(wfRes.data.workflows || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading your dashboard..." />;

  const stats = data?.stats || {};
  const recent = data?.recentRequests || [];
  const actionRequired = data?.actionRequired || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Submit new organizational requests and track your approval progress in real-time.
        </p>
      </div>

      {/* Action Required Banner for Changes Requested */}
      {actionRequired.length > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-purple-900">
                Action Required: {actionRequired.length} request(s) need changes
              </h4>
              <p className="text-xs text-purple-700">
                An approver requested modifications on your submission before it can proceed.
              </p>
            </div>
          </div>
          <Link
            to={`/requests/${actionRequired[0]._id}/edit`}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg shadow-sm"
          >
            Review & Resubmit
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Submissions</span>
            <FileText className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.total || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.pending || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.approved || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Changes Needed</span>
            <AlertCircle className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.changesRequested || 0}</div>
        </div>
      </div>

      {/* Quick Launch Workflows */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">Available Workflows</h2>
          <Link to="/catalog" className="text-xs font-semibold text-brand-600 hover:text-brand-800">
            View All Workflows →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflows.slice(0, 4).map((wf) => (
            <div
              key={wf._id}
              onClick={() => navigate(`/requests/new/${wf._id}`)}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <FilePlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                  {wf.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {wf.description || 'Configurable multi-stage approval workflow.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600">
                <span>Start Request</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Recent Requests</h3>
          <Link to="/my-requests" className="text-xs font-semibold text-brand-600 hover:text-brand-800">
            View Full History →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recent.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              You haven't submitted any requests yet. Choose a workflow above to get started!
            </div>
          ) : (
            recent.map((req) => (
              <div
                key={req._id}
                onClick={() => navigate(`/requests/${req._id}`)}
                className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {req.requestNumber}
                    </span>
                    <span className="font-semibold text-sm text-slate-800">
                      {req.workflowId?.name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Submitted: {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <StatusBadge status={req.status} />
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
