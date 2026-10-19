import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRequestById, getRequestAudit, cancelRequest } from '../../api/requests';
import { useAuth } from '../../context/AuthContext';
import ProgressTracker from '../../components/request/ProgressTracker';
import ActionPanel from '../../components/request/ActionPanel';
import Timeline from '../../components/request/Timeline';
import AISummaryCard from '../../components/request/AISummaryCard';
import DynamicForm from '../../components/form/DynamicForm';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  ArrowLeft,
  XCircle,
  RefreshCw,
  FileText,
  Download,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = async () => {
    try {
      const [detailRes, auditRes] = await Promise.all([
        getRequestById(id),
        getRequestAudit(id),
      ]);
      setData(detailRes.data);
      setAuditLogs(auditRes.data.auditLogs || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Request not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading request details..." />;
  if (error || !data) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white rounded-2xl border border-rose-200 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-500">{error || 'Unable to view this request.'}</p>
        <button
          onClick={() => navigate('/my-requests')}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          Return to My Requests
        </button>
      </div>
    );
  }

  const { request, stages, isAdminReadOnly } = data;
  const isOwner = user && request.requesterId?._id === user._id;

  // Find active stage that current user is eligible to act on
  const activeStage = stages.find((s) => {
    if (s.status !== 'active') return false;
    // Self-approval check: requester cannot act
    if (isOwner) return false;
    // Assigned directly
    const inAssigned = s.assignedTo?.some((u) => u._id === user?._id);
    const inEscalated = s.escalatedTo?.some((u) => u._id === user?._id);
    return inAssigned || inEscalated;
  });

  const canCancel =
    isOwner &&
    ['draft', 'pending', 'changes_requested'].includes(request.status) &&
    request.workflowVersionId?.settings?.allowCancel &&
    !stages.some((s) => s.status === 'approved' && s.locksCancellation);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this request? This action is permanent.')) {
      return;
    }
    setCancelling(true);
    try {
      await cancelRequest(id);
      fetchDetails();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  const fields = request.workflowVersionId?.fields || [];
  const attachments = request.attachments || [];

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Action Buttons for Requester */}
        <div className="flex items-center gap-2">
          {request.status === 'changes_requested' && isOwner && (
            <button
              onClick={() => navigate(`/requests/${id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Edit & Resubmit
            </button>
          )}

          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Request'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Read-Only Notice */}
      {isAdminReadOnly && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
          <UserCheck className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            You are viewing this request in <strong>Admin Read-Only</strong> mode. Per separation of duties, administrators have no approval authority.
          </span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-lg border border-brand-200">
              {request.requestNumber}
            </span>
            <StatusBadge status={request.status} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {request.workflowId?.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
            <span>
              Requester: <strong className="text-slate-800">{request.requesterId?.name}</strong> ({request.requesterId?.email})
            </span>
            <span>•</span>
            <span>Department: <strong className="text-slate-800">{request.departmentId?.name}</strong></span>
            <span>•</span>
            <span>Cycle: {request.cycle}</span>
            <span>•</span>
            <span>Version: v{request.workflowVersionId?.version}</span>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          <div>Submitted: {request.submittedAt ? new Date(request.submittedAt).toLocaleDateString() : 'Draft'}</div>
          {request.closedAt && (
            <div className="text-slate-600 mt-0.5 font-medium">
              Closed: {new Date(request.closedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Action Panel for Authorized Approvers */}
      {activeStage && (
        <ActionPanel activeStage={activeStage} onActionCompleted={fetchDetails} />
      )}

      {/* Visual Approval Stepper */}
      <ProgressTracker stages={stages} />

      {/* AI Summary Card */}
      <AISummaryCard requestId={id} />

      {/* Submitted Form Data & Attachments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Data */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
            Submitted Details
          </h3>
          <DynamicForm
            fields={fields}
            values={request.formData || {}}
            readOnly={true}
            requestId={id}
            attachments={attachments}
          />
        </div>

        {/* Attachments */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 h-fit">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
            Documents & Attachments
          </h3>

          {attachments.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No files attached to this request.</p>
          ) : (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att._id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 truncate">
                        {att.originalName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {(att.size / 1024).toFixed(1)} KB • {att.mimeType}
                    </span>
                  </div>

                  <a
                    href={`/api/attachments/${att._id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-white text-brand-600 hover:text-brand-800 rounded-lg border border-slate-200 shadow-2xs hover:bg-brand-50 shrink-0"
                    title="Authorized Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Append-Only Audit Timeline */}
      <Timeline logs={auditLogs} />
    </div>
  );
}
