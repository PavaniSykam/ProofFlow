import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getInbox } from '../../api/approvals';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Inbox, Clock, CheckCircle2, UserCheck, ArrowRight, AlertTriangle } from 'lucide-react';

const TABS = [
  { key: 'waiting', label: 'Waiting for Me', icon: Inbox },
  { key: 'overdue', label: 'Overdue', icon: AlertTriangle },
  { key: 'processed', label: 'Processed', icon: CheckCircle2 },
];

export default function ApproverInbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'waiting';
  const [tab, setTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await getInbox({ tab, page, limit: 15 });
      setItems(res.data.items || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [tab, page]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPage(1);
    setSearchParams({ tab: newTab });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Approvals Inbox</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review, approve, reject, or request changes on pending workflow submissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-brand-600 text-brand-600 bg-brand-50/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching inbox items..." />
        ) : items.length === 0 ? (
          <EmptyState
            title={`No ${tab} requests`}
            description={`There are currently no items under the ${tab} tab.`}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Request Number</th>
                    <th className="px-6 py-3">Requester</th>
                    <th className="px-6 py-3">Workflow</th>
                    <th className="px-6 py-3">Stage</th>
                    <th className="px-6 py-3">Deadline</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((inst) => {
                    const req = inst.requestId;
                    if (!req) return null;

                    return (
                      <tr
                        key={inst._id}
                        onClick={() => navigate(`/requests/${req._id}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-xs text-brand-600">
                          {req.requestNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">
                            {req.requesterId?.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {req.departmentId?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {req.workflowId?.name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-xs text-slate-800">{inst.name}</div>
                          {inst.isDelegated && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5">
                              <UserCheck className="w-3 h-3" /> via delegation for {inst.delegatedFor}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {inst.dueAt ? (
                            <div>
                              <span className="text-slate-600">
                                {new Date(inst.dueAt).toLocaleDateString()}
                              </span>
                              {inst.isOverdue && (
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded">
                                  OVERDUE
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-brand-600 hover:text-brand-800 text-xs font-semibold inline-flex items-center gap-1">
                            {tab === 'processed' ? 'View Details' : 'Review & Action'}{' '}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
