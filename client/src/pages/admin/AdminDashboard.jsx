import React, { useState, useEffect } from 'react';
import { getAdminStats } from '../../api/admin';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Users,
  Building2,
  Workflow,
  Files,
  AlertTriangle,
  Clock,
  ArrowRight,
  GitFork,
  ShieldCheck,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAdminStats();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner text="Loading administration metrics..." />;

  const users = stats?.users || {};
  const requests = stats?.requests || {};
  const alerts = stats?.alerts || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Console</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure organizational structures, manage versioned workflows, and monitor system health.
        </p>
      </div>

      {/* Attention Required Banner */}
      {alerts.needsAttention > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                {alerts.needsAttention} Stage(s) Require Admin Reassignment
              </h4>
              <p className="text-xs text-rose-700">
                Approver resolution could not find an active non-requester on the reporting chain.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/requests')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm"
          >
            Review Stuck Stages
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/admin/users')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-brand-500 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Users</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{users.active || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Total: {users.total} accounts</span>
        </div>

        <div
          onClick={() => navigate('/admin/departments')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-brand-500 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Departments</span>
            <Building2 className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.departments || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">With configured heads</span>
        </div>

        <div
          onClick={() => navigate('/admin/workflows')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-brand-500 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Workflows</span>
            <Workflow className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats?.workflows || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Published & versioned</span>
        </div>

        <div
          onClick={() => navigate('/admin/requests')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-brand-500 shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Requests</span>
            <Files className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{requests.total || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {requests.pending || 0} active in flight
          </span>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => navigate('/admin/workflows/new')}
          className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Workflow className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Workflow Builder</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Create or version generic multi-stage workflows with custom fields, approver rules, and SLAs.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Launch Builder</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/org-chart')}
          className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <GitFork className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Org Hierarchy Chart</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Inspect the complete reporting hierarchy tree: Executive → Department Heads → 6 PMs → 12 Devs.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>View Hierarchy</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/requests')}
          className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Request Monitor & Reassign</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Monitor organizational requests and perform authorized reassignments for stuck in-flight stages.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Open Monitor</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
