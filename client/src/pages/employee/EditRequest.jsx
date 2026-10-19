import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestById, updateDraft, submitRequest, resubmitRequest } from '../../api/requests';
import DynamicForm from '../../components/form/DynamicForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ArrowLeft, Save, Send, AlertCircle, RefreshCw } from 'lucide-react';

export default function EditRequest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [stages, setStages] = useState([]);
  const [formData, setFormData] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRequestById(id);
        const reqData = res.data.request;
        setRequest(reqData);
        setStages(res.data.stages || []);
        setFormData(reqData.formData || {});
        setAttachments(reqData.attachments || []);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to load request');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const isChangesRequested = request?.status === 'changes_requested';
  const isDraft = request?.status === 'draft';

  // Find comment from the stage that requested changes
  const changeStage = stages.find((s) => s.status === 'changes_requested');

  const handleSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await updateDraft(id, formData);
      alert('Changes saved!');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isChangesRequested) {
        await resubmitRequest(id, formData);
      } else {
        await updateDraft(id, formData);
        await submitRequest(id);
      }
      navigate(`/requests/${id}`);
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      const details = err.response?.data?.error?.details;
      if (details && Array.isArray(details)) {
        setError(details.map((d) => d.message).join(' | '));
      } else {
        setError(msg || 'Resubmission failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading request editor..." />;

  const fields = request?.workflowVersionId?.fields || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(`/requests/${id}`)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Request
      </button>

      {/* Changes requested feedback card */}
      {isChangesRequested && changeStage && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-purple-900">
                Approver Feedback (Stage: {changeStage.name})
              </h4>
              <p className="text-xs text-purple-800 mt-1 italic bg-white/70 p-2 rounded border border-purple-100">
                "{changeStage.comment}"
              </p>
              <p className="text-[11px] text-purple-600 mt-2">
                Make your corrections below and click <strong>Resubmit Request</strong> to restart the approval cycle.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
            Edit Request • {request?.requestNumber}
          </span>
          <h1 className="text-2xl font-bold text-slate-900">{request?.workflowId?.name}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Current Cycle: {request?.cycle} • Pinned Version: v{request?.workflowVersionId?.version}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm mb-6">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <DynamicForm
            fields={fields}
            values={formData}
            onChange={setFormData}
            requestId={id}
            attachments={attachments}
            onAttachmentChange={setAttachments}
          />

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            {isDraft && (
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save Draft</span>
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isChangesRequested ? (
                <>
                  <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                  <span>{submitting ? 'Resubmitting...' : 'Resubmit Request'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
