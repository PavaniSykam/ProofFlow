import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminRequests, reassignStageInstance, userLookup } from '../../api/admin';
import { getWorkflows } from '../../api/workflows';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import {
  Eye,
  Search,
  UserCheck,
  AlertCircle,
  Clock,
  ExternalLink,
  CheckCircle,
  X,
  Filter,
} from 'lucide-react';

export default function AdminRequestMonitor() {
  const [requests, setRequests] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('');
  const [search, setSearch] = useState('');

  // Reassignment Modal state
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [newAssigneeSearch, setNewAssigneeSearch] = useState('');
  const [newAssigneeResults, setNewAssigneeResults] = useState([]);
  const [selectedNewAssignee, setSelectedNewAssignee] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const navigate = useNavigate();

  const fetchWorkflows = async () => {
    try {
      const res = await getWorkflows();
      setWorkflows(res.data.workflows || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getAdminRequests({
        page,
        limit: 15,
        status: statusFilter || undefined,
        workflowId: workflowFilter || undefined,
        search: search || undefined,
      });
      setRequests(res.data.requests || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, workflowFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const openReassign = (req) => {
    setSelectedRequest(req);
    const activeStage = req.activeStages?.[0];
    setSelectedStageId(activeStage?._id || '');
    setNewAssigneeSearch('');
    setNewAssigneeResults([]);
    setSelectedNewAssignee(null);
    setActionError('');
    setShowReassignModal(true);
  };

  const handleUserLookup = async (q) => {
    setNewAssigneeSearch(q);
    if (!q || q.length < 2) {
      setNewAssigneeResults([]);
      return;
    }
    try {
      const res = await userLookup({ q });
      setNewAssigneeResults(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStageId) {
      setActionError('Please select a stage to reassign');
      return;
    }
    if (!selectedNewAssignee) {
      setActionError('Please select a new assignee');
      return;
    }

    try {
      await reassignStageInstance(selectedStageId, selectedNewAssignee._id);
      setShowReassignModal(false);
      setActionSuccess(`Stage successfully reassigned to ${selectedNewAssignee.name}`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchRequests();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reassign stage');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Request Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organization-wide oversight of active, stalled, and completed workflow requests.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Request Number (e.g. REQ-2026-)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="changes_requested">Changes Requested</option>
            <option value="cancelled">Cancelled</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={workflowFilter}
            onChange={(e) => {
              setWorkflowFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Workflows</option>
            {workflows.map((wf) => (
              <option key={wf._id} value={wf._id}>
                {wf.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" message="Loading organization requests..." />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No requests found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Request #</th>
                  <th className="px-6 py-3.5">Workflow</th>
                  <th className="px-6 py-3.5">Requester</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Current Stage / Approver</th>
                  <th className="px-6 py-3.5">SLA / Health</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => {
                  const activeStage = r.activeStages?.[0];
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-xs">
                        <button
                          onClick={() => navigate(`/requests/${r._id}`)}
                          className="hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {r.requestNumber}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {r.workflowId?.name || 'Workflow'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{r.requesterId?.name}</div>
                        <div className="text-xs text-slate-400">{r.requesterId?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {r.status === 'pending' && activeStage ? (
                          <div>
                            <span className="font-semibold text-slate-700 block">
                              Stage {activeStage.order}: {activeStage.name}
                            </span>
                            <span className="text-slate-500">
                              Assigned to:{' '}
                              <strong>
                                {Array.isArray(activeStage.assignedTo)
                                  ? activeStage.assignedTo.map((a) => a?.name || a).join(', ')
                                  : activeStage.assignedTo?.name || 'Unassigned'}
                              </strong>
                            </span>
                            {activeStage.escalatedTo?.length > 0 && (
                              <span className="text-rose-600 block text-[11px] font-medium">
                                Escalated
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No active stage</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Clock className="w-3 h-3 text-rose-600" /> Overdue
                          </span>
                        ) : r.needsAdminAttention ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" /> Stalled
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Normal</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/requests/${r._id}`)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {r.status === 'pending' && activeStage && (
                            <button
                              onClick={() => openReassign(r)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 cursor-pointer"
                              title="Reassign Stage Assignee"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Reassign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-200">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Modal: Reassign Stage */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                Reassign In-Flight Approval Stage
              </h2>
              <button
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Request: <strong className="text-slate-800">{selectedRequest?.requestNumber}</strong>{' '}
              ({selectedRequest?.workflowId?.name})
            </p>

            {actionError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {actionError}
              </div>
            )}

            <form onSubmit={handleReassignSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Active Stage to Reassign
                </label>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {selectedRequest?.activeStages?.map((s) => (
                    <option key={s._id} value={s._id}>
                      Stage {s.order}: {s.name} (Current:{' '}
                      {Array.isArray(s.assignedTo)
                        ? s.assignedTo.map((a) => a?.name || a).join(', ')
                        : s.assignedTo?.name || 'Unassigned'}
                      )
                    </option>
                  ))}
                </select>
              </div>

              {/* New Assignee Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Select New Assignee
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search replacement approver..."
                    value={newAssigneeSearch}
                    onChange={(e) => handleUserLookup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {selectedNewAssignee && (
                    <div className="mt-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-indigo-900">
                          {selectedNewAssignee.name}
                        </span>
                        <span className="text-indigo-600 ml-2">
                          ({selectedNewAssignee.email})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNewAssignee(null);
                          setNewAssigneeSearch('');
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800"
                      >
                        Change
                      </button>
                    </div>
                  )}
                  {newAssigneeResults.length > 0 && !selectedNewAssignee && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-44 overflow-y-auto divide-y divide-slate-100">
                      {newAssigneeResults
                        .filter((u) => u._id !== selectedRequest?.requesterId?._id)
                        .map((u) => (
                          <div
                            key={u._id}
                            onClick={() => {
                              setSelectedNewAssignee(u);
                              setNewAssigneeSearch(`${u.name} (${u.email})`);
                              setNewAssigneeResults([]);
                            }}
                            className="p-2.5 text-xs hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{u.name}</span>
                              <span className="text-slate-400 ml-2">{u.email}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{u.roles?.join(', ')}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                ⚠️ Reassigning will notify the new assignee and record an immutable audit log entry.
                Self-approval rules remain strictly enforced by the backend engine.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
