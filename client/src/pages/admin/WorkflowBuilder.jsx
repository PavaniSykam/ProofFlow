import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkflowById, createWorkflow, updateWorkflow } from '../../api/workflows';
import { getAdminRoles } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Layers,
  Settings,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text', label: 'Single Line Text' },
  { value: 'textarea', label: 'Multi-line Textarea' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'dropdown', label: 'Dropdown Select' },
  { value: 'checkbox', label: 'Checkbox (Yes/No)' },
  { value: 'file', label: 'Document File Upload' },
];

const APPROVER_TYPES = [
  { value: 'reporting_manager', label: 'Requester\'s Reporting Manager' },
  { value: 'department_head', label: 'Head of Requester\'s Department' },
  { value: 'role', label: 'Role Pool (HR, Finance, IT, etc.)' },
];

export default function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);

  // Workflow meta
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [allowCancel, setAllowCancel] = useState(true);

  // Dynamic definitions
  const [fields, setFields] = useState([]);
  const [stages, setStages] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const rolesRes = await getAdminRoles();
        setRoles(rolesRes.data.roles || []);

        if (isEditing) {
          const res = await getWorkflowById(id);
          const wf = res.data.workflow;
          const ver = wf.versionDefinition || {};
          setName(wf.name || '');
          setKey(wf.key || '');
          setDescription(wf.description || '');
          setAllowCancel(ver.settings?.allowCancel !== false);
          setFields(ver.fields || []);
          setStages(ver.stages || []);
        } else {
          // Default initial stage
          setStages([
            {
              key: 'manager_review',
              name: 'Reporting Manager Review',
              order: 1,
              approver: { type: 'reporting_manager' },
              slaHours: 24,
              reminderPercent: 75,
              locksCancellation: false,
              escalation: { enabled: false },
            },
          ]);
        }
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to initialize builder');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEditing]);

  // Field helpers
  const handleAddField = () => {
    setFields([
      ...fields,
      {
        key: `field_${fields.length + 1}`,
        label: `New Field ${fields.length + 1}`,
        type: 'text',
        required: false,
        helpText: '',
        options: [],
        order: fields.length + 1,
      },
    ]);
  };

  const handleUpdateField = (index, keyName, value) => {
    const updated = [...fields];
    updated[index][keyName] = value;
    setFields(updated);
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // Stage helpers
  const handleAddStage = () => {
    const nextOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.order)) + 1 : 1;
    setStages([
      ...stages,
      {
        key: `stage_${stages.length + 1}`,
        name: `Stage ${stages.length + 1}`,
        order: nextOrder,
        approver: { type: 'role', roleKey: 'hr' },
        slaHours: 48,
        reminderPercent: 75,
        locksCancellation: false,
        escalation: { enabled: false },
      },
    ]);
  };

  const handleUpdateStage = (index, keyName, value) => {
    const updated = [...stages];
    updated[index][keyName] = value;
    setStages(updated);
  };

  const handleUpdateStageApprover = (index, keyName, value) => {
    const updated = [...stages];
    updated[index].approver = { ...updated[index].approver, [keyName]: value };
    setStages(updated);
  };

  const handleRemoveStage = (index) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fields.length === 0) {
      setError('Please add at least one form field.');
      return;
    }
    if (stages.length === 0) {
      setError('Please add at least one approval stage.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      name,
      key: key.toLowerCase().trim(),
      description,
      settings: { allowCancel, resubmitMode: 'restart' },
      fields: fields.map((f, i) => ({
        ...f,
        order: i + 1,
        options: typeof f.options === 'string' ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : f.options || [],
      })),
      stages: stages.map((s) => ({
        ...s,
        order: Number(s.order),
        slaHours: s.slaHours ? Number(s.slaHours) : 24,
      })),
    };

    try {
      if (isEditing) {
        await updateWorkflow(id, payload);
      } else {
        await createWorkflow(payload);
      }
      navigate('/admin/workflows');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save workflow definition');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading builder..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/workflows')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workflows
        </button>

        <span className="text-xs text-slate-400 font-medium">
          {isEditing ? 'Editing will publish a new immutable version' : 'Creating new workflow definition'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-600" />
            <span>Workflow Settings</span>
          </h2>

          {error && (
            <div className="flex items-center gap-1.5 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Workflow Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Travel Authorization"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unique Key Identifier *
              </label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. travel-authorization"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-mono disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of when and how this workflow is used..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={allowCancel}
              onChange={(e) => setAllowCancel(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded"
            />
            <span className="text-xs text-slate-700 font-medium">
              Allow requesters to cancel in-flight requests (unless a locking stage has completed)
            </span>
          </label>
        </div>

        {/* Dynamic Form Field Definitions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Form Field Definitions</h2>
              <p className="text-xs text-slate-500">Configure inputs presented to employees</p>
            </div>
            <button
              type="button"
              onClick={handleAddField}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Field
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((f, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Field #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveField(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Label *
                    </label>
                    <input
                      type="text"
                      required
                      value={f.label}
                      onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Key (Slug) *
                    </label>
                    <input
                      type="text"
                      required
                      value={f.key}
                      onChange={(e) => handleUpdateField(idx, 'key', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Type *
                    </label>
                    <select
                      value={f.type}
                      onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {f.type === 'dropdown' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Options (comma-separated) *
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(f.options) ? f.options.join(', ') : f.options}
                      onChange={(e) => handleUpdateField(idx, 'options', e.target.value)}
                      placeholder="Option 1, Option 2, Option 3"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-brand-600"
                    />
                    <span>Required Field</span>
                  </label>
                  <input
                    type="text"
                    value={f.helpText || ''}
                    onChange={(e) => handleUpdateField(idx, 'helpText', e.target.value)}
                    placeholder="Helper text / placeholder..."
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval Stage Definitions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Approval Stages & Routing Rules</h2>
              <p className="text-xs text-slate-500">
                Configure sequential stages or parallel groups (same order number = parallel clearance)
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddStage}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Stage
            </button>
          </div>

          <div className="space-y-3">
            {stages.map((s, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      Order:
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={s.order}
                      onChange={(e) => handleUpdateStage(idx, 'order', e.target.value)}
                      className="w-16 px-2 py-0.5 text-xs font-bold border border-slate-300 rounded bg-white text-center"
                    />
                    <span className="text-[11px] text-slate-400">
                      (Same order executes concurrently)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveStage(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Stage Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={s.name}
                      onChange={(e) => handleUpdateStage(idx, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Approver Rule *
                    </label>
                    <select
                      value={s.approver?.type || 'reporting_manager'}
                      onChange={(e) => handleUpdateStageApprover(idx, 'type', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    >
                      {APPROVER_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {s.approver?.type === 'role' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                        Select Role *
                      </label>
                      <select
                        value={s.approver?.roleKey || ''}
                        onChange={(e) => handleUpdateStageApprover(idx, 'roleKey', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                      >
                        <option value="">Choose role...</option>
                        {roles.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.name} ({r.key})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      SLA Hours
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={s.slaHours || 24}
                      onChange={(e) => handleUpdateStage(idx, 'slaHours', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s.locksCancellation}
                      onChange={(e) => handleUpdateStage(idx, 'locksCancellation', e.target.checked)}
                      className="w-3.5 h-3.5 text-brand-600 rounded"
                    />
                    <span>Locks cancellation once approved</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/workflows')}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-semibold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Publishing...' : isEditing ? 'Publish New Version' : 'Create Workflow'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
