import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkflowById } from '../../api/workflows';
import { createDraft, updateDraft, submitRequest } from '../../api/requests';
import DynamicForm from '../../components/form/DynamicForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ArrowLeft, Save, Send, AlertCircle } from 'lucide-react';

export default function NewRequest() {
  const { workflowId } = useParams();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState(null);
  const [draftRequest, setDraftRequest] = useState(null);
  const [formData, setFormData] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const wfRes = await getWorkflowById(workflowId);
        setWorkflow(wfRes.data.workflow);

        // Pre-create draft on the server so file uploads can bind immediately
        const draftRes = await createDraft(workflowId, {});
        setDraftRequest(draftRes.data.request);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to initialize request');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [workflowId]);

  const handleSaveDraft = async () => {
    if (!draftRequest) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateDraft(draftRequest._id, formData);
      alert('Draft saved successfully!');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!draftRequest) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1. Update form data in draft
      await updateDraft(draftRequest._id, formData);
      // 2. Submit request through workflow engine
      await submitRequest(draftRequest._id);
      navigate(`/requests/${draftRequest._id}`);
    } catch (err) {
      const msg = err.response?.data?.error?.message;
      const details = err.response?.data?.error?.details;
      if (details && Array.isArray(details)) {
        setError(details.map((d) => d.message).join(' | '));
      } else {
        setError(msg || 'Submission failed. Please check all required fields.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Preparing dynamic form..." />;

  const fields = workflow?.versionDefinition?.fields || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/catalog')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </button>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-100 pb-5 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
            New Submission
          </span>
          <h1 className="text-2xl font-bold text-slate-900">{workflow?.name}</h1>
          <p className="text-sm text-slate-500 mt-1">{workflow?.description}</p>
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
            requestId={draftRequest?._id}
            attachments={attachments}
            onAttachmentChange={setAttachments}
          />

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Save Draft</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
