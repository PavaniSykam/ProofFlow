import React, { useState, useEffect } from 'react';
import { getAdminWorkflows, toggleWorkflowActive } from '../../api/workflows';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Workflow, Plus, Edit, Eye, Power, AlertCircle } from 'lucide-react';

export default function AdminWorkflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await getAdminWorkflows();
      setWorkflows(res.data.workflows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (id, currentActive) => {
    try {
      await toggleWorkflowActive(id, !currentActive);
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Toggle failed');
    }
  };

  if (loading) return <LoadingSpinner text="Loading workflows..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workflows & Versioning</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure dynamic workflow definitions, versioning rules, approvers, and field templates.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/workflows/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" /> Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workflows.map((wf) => {
          const stages = wf.latestVersion?.stages || [];
          const fields = wf.latestVersion?.fields || [];

          return (
            <div
              key={wf._id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {wf.key}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
                      v{wf.currentVersion}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggle(wf._id, wf.isActive)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer ${
                      wf.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    <span>{wf.isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{wf.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {wf.description || 'Configurable multi-stage approval workflow.'}
                </p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Versions:</span>
                    <span className="font-semibold text-slate-800">{wf.totalVersions || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Form Fields:</span>
                    <span className="font-semibold text-slate-800">{fields.length} configured</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Approval Stages:</span>
                    <span className="font-semibold text-slate-800">
                      {stages.map((s) => s.name).join(' → ') || 'No stages'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => navigate(`/admin/workflows/${wf._id}/edit`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit & Version
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
