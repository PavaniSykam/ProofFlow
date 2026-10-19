import React, { useState, useEffect } from 'react';
import { getDelegations, createDelegation, revokeDelegation } from '../../api/delegations';
import { userLookup } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UserCheck, Plus, XCircle, AlertCircle, Calendar } from 'lucide-react';

export default function Delegations() {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState({ asDelegator: [], asDelegate: [] });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [delegateId, setDelegateId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const loadData = async () => {
    try {
      const [delRes, userRes] = await Promise.all([
        getDelegations(),
        userLookup(),
      ]);
      setDelegations(delRes.data);
      setUsers(userRes.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createDelegation({
        delegateId,
        startsAt,
        endsAt,
      });
      setModalOpen(false);
      setDelegateId('');
      setStartsAt('');
      setEndsAt('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to create delegation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this delegation immediately?')) return;
    try {
      await revokeDelegation(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Revocation failed');
    }
  };

  if (loading) return <LoadingSpinner text="Loading delegations..." />;

  // Filter delegate candidates: must not be current user and must have at least one approver role
  const eligibleCandidates = users.filter((u) => u._id !== user?._id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Authority Delegations</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Temporarily delegate your approval authority during leave or out-of-office periods.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" /> Delegate Authority
        </button>
      </div>

      {/* Delegations Created by Me */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">
            Active Delegations Created by You
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Colleagues authorized to act on your behalf during configured date ranges.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {delegations.asDelegator?.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              You have not created any active delegations.
            </div>
          ) : (
            delegations.asDelegator.map((d) => {
              const isRevoked = Boolean(d.revokedAt);
              const now = new Date();
              const isCurrent =
                !isRevoked && new Date(d.startsAt) <= now && new Date(d.endsAt) >= now;

              return (
                <div
                  key={d._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {d.delegateId?.name}
                      </span>
                      <span className="text-xs text-slate-500">({d.delegateId?.email})</span>
                      {isCurrent ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                          Active Now
                        </span>
                      ) : isRevoked ? (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full">
                          Revoked
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 rounded-full">
                          Scheduled
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {new Date(d.startsAt).toLocaleDateString()} —{' '}
                        {new Date(d.endsAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {!isRevoked && (
                    <button
                      onClick={() => handleRevoke(d._id)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg self-start sm:self-auto cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delegations Received */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">Delegations Received by You</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Colleagues who have delegated approval authority to you.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {delegations.asDelegate?.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No colleagues have delegated authority to you.
            </div>
          ) : (
            delegations.asDelegate.map((d) => (
              <div key={d._id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-slate-900">
                    From: {d.delegatorId?.name} ({d.delegatorId?.email})
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Valid: {new Date(d.startsAt).toLocaleDateString()} to{' '}
                    {new Date(d.endsAt).toLocaleDateString()}
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-brand-50 text-brand-700 rounded-full">
                  Granted
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Delegation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Delegate Approval Authority</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select a peer approver and specify the active date range.
            </p>

            {error && (
              <div className="flex items-center gap-1.5 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs mt-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Delegate
                </label>
                <select
                  required
                  value={delegateId}
                  onChange={(e) => setDelegateId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Choose a colleague...</option>
                  {eligibleCandidates.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.roles?.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Grant Delegation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
