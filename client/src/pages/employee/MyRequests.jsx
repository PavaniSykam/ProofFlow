import React, { useState, useEffect } from 'react';
import { getMyRequests } from '../../api/requests';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Search, PlusCircle, ArrowRight } from 'lucide-react';

const TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'In Progress' },
  { key: 'changes_requested', label: 'Changes Needed' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'draft', label: 'Drafts' },
];

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getMyRequests({
        status: tab || undefined,
        search: search || undefined,
        page,
        limit: 10,
      });
      setRequests(res.data.requests || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [tab, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track and manage all your past and current organizational requests.
          </p>
        </div>
        <button
          onClick={() => navigate('/catalog')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all cursor-pointer self-start"
        >
          <PlusCircle className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                tab === t.key
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PF-2026-..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching your requests..." />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No requests found"
            description="No requests match your current filter criteria."
            action={
              <button
                onClick={() => navigate('/catalog')}
                className="px-4 py-2 text-xs font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                Browse Catalog
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Request Number</th>
                    <th className="px-6 py-3">Workflow</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Current Active Stage</th>
                    <th className="px-6 py-3">Submitted</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <tr
                      key={req._id}
                      onClick={() => navigate(`/requests/${req._id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-xs text-brand-600">
                        {req.requestNumber}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {req.workflowId?.name}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} isOverdue={req.isOverdue} />
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {req.activeStages && req.activeStages.length > 0
                          ? req.activeStages.map((s) => s.name).join(', ')
                          : req.status === 'approved'
                          ? 'All stages completed'
                          : req.status === 'draft'
                          ? 'Not submitted'
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : 'Draft'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-brand-600 hover:text-brand-800 text-xs font-semibold inline-flex items-center gap-1">
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
