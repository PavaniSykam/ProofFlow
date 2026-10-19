import React, { useState } from 'react';
import { Check, X, CornerUpLeft, AlertCircle } from 'lucide-react';
import { approveStage, rejectStage, requestChanges } from '../../api/approvals';

export default function ActionPanel({ activeStage, onActionCompleted }) {
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject' | 'request_changes'
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!activeStage || activeStage.status !== 'active') return null;

  const handleOpenModal = (type) => {
    setModalType(type);
    setComment('');
    setError(null);
  };

  const handleCloseModal = () => {
    setModalType(null);
    setComment('');
    setError(null);
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    setError(null);

    // Enforce mandatory reason for reject and request_changes
    if (modalType === 'reject' && !comment.trim()) {
      setError('A rejection reason is strictly mandatory.');
      return;
    }
    if (modalType === 'request_changes' && !comment.trim()) {
      setError('A comment specifying requested changes is strictly mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalType === 'approve') {
        await approveStage(activeStage._id, comment);
      } else if (modalType === 'reject') {
        await rejectStage(activeStage._id, comment);
      } else if (modalType === 'request_changes') {
        await requestChanges(activeStage._id, comment);
      }
      handleCloseModal();
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm bg-gradient-to-r from-amber-50/50 to-orange-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
              Action Required
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              You are an authorized approver for: <span className="text-brand-600">{activeStage.name}</span>
            </h3>
            {activeStage.delegatedFor && (
              <p className="text-xs text-amber-800 font-medium mt-1">
                Authorized via active delegation for {activeStage.delegatedFor}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleOpenModal('approve')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => handleOpenModal('request_changes')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <CornerUpLeft className="w-4 h-4" /> Request Changes
            </button>
            <button
              onClick={() => handleOpenModal('reject')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 capitalize">
              {modalType === 'approve'
                ? 'Approve Stage'
                : modalType === 'reject'
                ? 'Reject Request'
                : 'Request Changes'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Stage: <span className="font-semibold">{activeStage.name}</span>
            </p>

            <form onSubmit={handleSubmitAction} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {modalType === 'approve'
                    ? 'Optional Approval Comment'
                    : modalType === 'reject'
                    ? 'Reason for Rejection *'
                    : 'Changes Required Details *'}
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    modalType === 'approve'
                      ? 'Add any remarks or context (optional)...'
                      : modalType === 'reject'
                      ? 'Explain why this request is being rejected...'
                      : 'Specify what information or attachments need to be updated...'
                  }
                  required={modalType !== 'approve'}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm disabled:opacity-50 ${
                    modalType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : modalType === 'reject'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {submitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
