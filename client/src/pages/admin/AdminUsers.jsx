import React, { useState, useEffect } from 'react';
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deactivateAdminUser,
  resetAdminUserPassword,
  getAdminDepartments,
  getAdminRoles,
  userLookup,
} from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import {
  Search,
  Plus,
  Edit2,
  KeyRound,
  UserX,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  Building,
  Shield,
  X,
} from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: ['employee'],
    departmentId: '',
    managerId: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [managerResults, setManagerResults] = useState([]);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, dRes, rRes] = await Promise.all([
        getAdminUsers({ page, limit: 10, search, departmentId: deptFilter || undefined }),
        getAdminDepartments(),
        getAdminRoles(),
      ]);
      setUsers(uRes.data.items || []);
      setTotalPages(uRes.data.pages || 1);
      setDepartments(dRes.data.departments || []);
      setRoles(rRes.data.roles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, deptFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleManagerLookup = async (q) => {
    setManagerSearch(q);
    if (!q || q.length < 2) {
      setManagerResults([]);
      return;
    }
    try {
      const res = await userLookup({ q });
      setManagerResults(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: 'Password123!',
      roles: ['employee'],
      departmentId: departments[0]?._id || '',
      managerId: '',
    });
    setManagerSearch('');
    setManagerResults([]);
    setActionError('');
    setShowCreateModal(true);
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      roles: user.roles || [],
      departmentId: user.departmentId?._id || user.departmentId || '',
      managerId: user.managerId?._id || user.managerId || '',
    });
    setManagerSearch(user.managerId?.name || '');
    setManagerResults([]);
    setActionError('');
    setShowEditModal(true);
  };

  const openReset = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setActionError('');
    setShowResetModal(true);
  };

  const openDeactivate = (user) => {
    setSelectedUser(user);
    setActionError('');
    setShowDeactivateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined,
        roles: formData.roles,
        departmentId: formData.departmentId || null,
        managerId: formData.managerId || null,
      };
      await createAdminUser(payload);
      setShowCreateModal(false);
      setActionSuccess('User created successfully');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      const payload = {
        name: formData.name,
        roles: formData.roles,
        departmentId: formData.departmentId || null,
        managerId: formData.managerId || null,
      };
      await updateAdminUser(selectedUser._id, payload);
      setShowEditModal(false);
      setActionSuccess('User updated successfully');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await resetAdminUserPassword(selectedUser._id, newPassword);
      setShowResetModal(false);
      setActionSuccess(`Password reset successfully for ${selectedUser.email}`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleDeactivateConfirm = async () => {
    setActionError('');
    try {
      await deactivateAdminUser(selectedUser._id);
      setShowDeactivateModal(false);
      setActionSuccess(`User ${selectedUser.name} deactivated`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const toggleRole = (rKey) => {
    const cur = formData.roles || [];
    if (cur.includes(rKey)) {
      if (cur.length === 1) return; // Keep at least one role
      setFormData({ ...formData, roles: cur.filter((r) => r !== rKey) });
    } else {
      setFormData({ ...formData, roles: [...cur, rKey] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage organizational users, reporting hierarchies, and role assignments.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" message="Loading users..." />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No users match the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Reporting Manager</th>
                  <th className="px-6 py-3.5">Roles</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {u.departmentId?.name ? (
                        <span className="inline-flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {u.departmentId.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {u.managerId?.name ? (
                        <div className="text-xs">
                          <span className="font-medium text-slate-700">{u.managerId.name}</span>
                          <span className="text-slate-400 block text-[11px]">{u.managerId.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Top-level (No manager)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              r === 'admin'
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : r === 'manager' || r === 'department_head'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openReset(u)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {u.isActive && (
                          <button
                            onClick={() => openDeactivate(u)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Deactivate User"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-200">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@nexora.example"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave default or set temporary password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Department
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None (Cross-department / Top Executive)</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reporting Manager Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reporting Manager
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search manager by name or email..."
                    value={managerSearch}
                    onChange={(e) => handleManagerLookup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.managerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, managerId: '' });
                        setManagerSearch('');
                      }}
                      className="absolute right-2 top-2 text-xs text-rose-500 hover:text-rose-700"
                    >
                      Clear
                    </button>
                  )}
                  {managerResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {managerResults.map((m) => (
                        <div
                          key={m._id}
                          onClick={() => {
                            setFormData({ ...formData, managerId: m._id });
                            setManagerSearch(`${m.name} (${m.email})`);
                            setManagerResults([]);
                          }}
                          className="p-2 text-xs hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{m.name}</span>
                            <span className="text-slate-400 ml-2">{m.email}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{m.roles?.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Roles Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assign Roles *
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {roles.map((r) => {
                    const checked = formData.roles.includes(r.key);
                    return (
                      <label
                        key={r.key}
                        className={`flex items-center gap-2 p-2 border rounded-lg text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-medium'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRole(r.key)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{r.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit User ({selectedUser?.email})</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {actionError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Department
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reporting Manager Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reporting Manager
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search manager..."
                    value={managerSearch}
                    onChange={(e) => handleManagerLookup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.managerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, managerId: '' });
                        setManagerSearch('');
                      }}
                      className="absolute right-2 top-2 text-xs text-rose-500 hover:text-rose-700"
                    >
                      Clear
                    </button>
                  )}
                  {managerResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {managerResults
                        .filter((m) => m._id !== selectedUser?._id)
                        .map((m) => (
                          <div
                            key={m._id}
                            onClick={() => {
                              setFormData({ ...formData, managerId: m._id });
                              setManagerSearch(`${m.name} (${m.email})`);
                              setManagerResults([]);
                            }}
                            className="p-2 text-xs hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{m.name}</span>
                              <span className="text-slate-400 ml-2">{m.email}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{m.roles?.join(', ')}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Roles Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assign Roles
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {roles.map((r) => {
                    const checked = formData.roles?.includes(r.key);
                    return (
                      <label
                        key={r.key}
                        className={`flex items-center gap-2 p-2 border rounded-lg text-xs cursor-pointer transition-colors ${
                          checked
                            ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-medium'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRole(r.key)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{r.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900">Reset User Password</h2>
            <p className="text-xs text-slate-500 mt-1">
              Set a new password for <span className="font-semibold text-slate-800">{selectedUser?.email}</span>.
            </p>

            {actionError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {actionError}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 cursor-pointer"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Deactivate Confirmation */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-bold text-slate-900">Confirm Deactivation</h2>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to deactivate <span className="font-semibold text-slate-900">{selectedUser?.name}</span> ({selectedUser?.email})?
            </p>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
              <p>• The user will be immediately logged out and blocked from signing in.</p>
              <p>• Any active approval stages assigned will require reassignment.</p>
              <p>• Any subordinates reporting to this user will need their manager updated.</p>
            </div>

            {actionError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateConfirm}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
