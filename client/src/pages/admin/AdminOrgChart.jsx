import React, { useState, useEffect, useMemo } from 'react';
import { getAdminOrgChart } from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  GitFork,
  ChevronDown,
  ChevronRight,
  User,
  Building,
  Shield,
  Search,
  Users,
} from 'lucide-react';

export default function AdminOrgChart() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});

  useEffect(() => {
    const fetchChart = async () => {
      setLoading(true);
      try {
        const res = await getAdminOrgChart();
        setUsers(res.data.orgChart || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChart();
  }, []);

  // Build tree mapping
  const { rootNodes, childrenMap, userMap } = useMemo(() => {
    const uMap = {};
    const cMap = {};
    const roots = [];

    users.forEach((u) => {
      uMap[u._id] = u;
      cMap[u._id] = [];
    });

    users.forEach((u) => {
      const mId = u.managerId?._id || u.managerId;
      if (mId && uMap[mId]) {
        cMap[mId].push(u);
      } else {
        roots.push(u);
      }
    });

    return { rootNodes: roots, childrenMap: cMap, userMap: uMap };
  }, [users]);

  const toggleCollapse = (id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => setCollapsed({});
  const collapseAll = () => {
    const all = {};
    users.forEach((u) => {
      if ((childrenMap[u._id] || []).length > 0) {
        all[u._id] = true;
      }
    });
    setCollapsed(all);
  };

  // Recursive tree node component
  const TreeNode = ({ user, level = 0 }) => {
    const children = childrenMap[user._id] || [];
    const hasChildren = children.length > 0;
    const isCollapsed = collapsed[user._id];
    const matchesSearch =
      search &&
      (user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.departmentId?.name?.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="flex flex-col items-start my-2">
        {/* Node Card */}
        <div
          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
            matchesSearch
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-md'
              : level === 0
              ? 'bg-gradient-to-r from-indigo-900 to-indigo-800 text-white border-indigo-700 shadow-md'
              : level === 1
              ? 'bg-white border-indigo-200 shadow-xs hover:border-indigo-400'
              : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
          }`}
          style={{ minWidth: '280px', maxWidth: '360px' }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleCollapse(user._id)}
              className={`p-1 rounded-md cursor-pointer transition-colors ${
                level === 0
                  ? 'hover:bg-white/20 text-white'
                  : 'hover:bg-slate-100 text-slate-500'
              }`}
              title={isCollapsed ? 'Expand reports' : 'Collapse reports'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span
                className={`font-bold text-sm truncate ${
                  level === 0 ? 'text-white' : 'text-slate-900'
                }`}
              >
                {user.name}
              </span>
              {hasChildren && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    level === 0
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                  title={`${children.length} direct report(s)`}
                >
                  {children.length} reports
                </span>
              )}
            </div>

            <div
              className={`text-xs truncate ${
                level === 0 ? 'text-indigo-200' : 'text-slate-400'
              }`}
            >
              {user.email}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {user.departmentId?.name && (
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    level === 0
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building className="w-3 h-3" />
                  {user.departmentId.code || user.departmentId.name}
                </span>
              )}

              {user.roles?.map((r) => (
                <span
                  key={r}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    level === 0
                      ? 'bg-amber-400 text-indigo-950'
                      : r === 'admin'
                      ? 'bg-indigo-100 text-indigo-800'
                      : r === 'manager' || r === 'department_head'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Child Subtree */}
        {hasChildren && !isCollapsed && (
          <div className="pl-6 ml-4 border-l-2 border-indigo-200/70 mt-1 flex flex-col space-y-1">
            {children.map((child) => (
              <TreeNode key={child._id} user={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Organizational Hierarchy
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete reporting lines used by the workflow engine for exact manager approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer shadow-xs"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Search Bar & Summary */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Highlight user, email, or department in chart..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <Users className="w-4 h-4 text-indigo-500" />
          <span>Total active staff in tree: <strong>{users.length}</strong></span>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs overflow-x-auto min-h-[500px]">
        {loading ? (
          <div className="py-20">
            <LoadingSpinner size="lg" message="Loading reporting hierarchy..." />
          </div>
        ) : rootNodes.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No organizational hierarchy data available.
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {rootNodes.map((root) => (
              <TreeNode key={root._id} user={root} level={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
