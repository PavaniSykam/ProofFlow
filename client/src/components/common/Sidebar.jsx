import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus,
  Files,
  Inbox,
  UserCheck,
  ShieldAlert,
  GitFork,
  Users,
  Building2,
  Workflow,
  Eye,
  Award,
} from 'lucide-react';

export default function Sidebar() {
  const { isApprover, isAdmin } = useAuth();

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-brand-50 text-brand-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Employee Section */}
        <div>
          <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            My Workspace
          </div>
          <nav className="space-y-1">
            <NavLink to="/" end className={navClass}>
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/catalog" className={navClass}>
              <FilePlus className="w-4 h-4 text-slate-500" />
              <span>Request Catalog</span>
            </NavLink>
            <NavLink to="/my-requests" className={navClass}>
              <Files className="w-4 h-4 text-slate-500" />
              <span>My Requests</span>
            </NavLink>
          </nav>
        </div>

        {/* Approver Section */}
        {isApprover && (
          <div>
            <div className="px-3 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
              Approvals
            </div>
            <nav className="space-y-1">
              <NavLink to="/approver/dashboard" className={navClass}>
                <LayoutDashboard className="w-4 h-4 text-amber-500" />
                <span>Approver Dashboard</span>
              </NavLink>
              <NavLink to="/approver/inbox" className={navClass}>
                <Inbox className="w-4 h-4 text-amber-500" />
                <span>Approvals Inbox</span>
              </NavLink>
              <NavLink to="/delegations" className={navClass}>
                <UserCheck className="w-4 h-4 text-amber-500" />
                <span>Delegations</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <div>
            <div className="px-3 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
              Administration
            </div>
            <nav className="space-y-1">
              <NavLink to="/admin/dashboard" className={navClass}>
                <ShieldAlert className="w-4 h-4 text-indigo-500" />
                <span>Admin Dashboard</span>
              </NavLink>
              <NavLink to="/admin/workflows" className={navClass}>
                <Workflow className="w-4 h-4 text-indigo-500" />
                <span>Workflows & Versions</span>
              </NavLink>
              <NavLink to="/admin/requests" className={navClass}>
                <Eye className="w-4 h-4 text-indigo-500" />
                <span>Request Monitor</span>
              </NavLink>
              <NavLink to="/admin/users" className={navClass}>
                <Users className="w-4 h-4 text-indigo-500" />
                <span>User Directory</span>
              </NavLink>
              <NavLink to="/admin/org-chart" className={navClass}>
                <GitFork className="w-4 h-4 text-indigo-500" />
                <span>Org Hierarchy</span>
              </NavLink>
              <NavLink to="/admin/departments" className={navClass}>
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>Departments</span>
              </NavLink>
              <NavLink to="/admin/roles" className={navClass}>
                <Award className="w-4 h-4 text-indigo-500" />
                <span>Role Management</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 text-center">
        ProofFlow v1.0 • Academic Build
      </div>
    </aside>
  );
}
