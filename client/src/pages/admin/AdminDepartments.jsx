import React, { useState, useEffect } from 'react';
import {
  getAdminDepartments,
  createAdminDepartment,
  updateAdminDepartment,
  userLookup,
} from '../../api/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Building2,
  Plus,
  Edit2,
  User,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headUserId: '',
  });

  const [headSearch, setHeadSearch] = useState('');
  const [headResults, setHeadResults] = useState([]);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await getAdminDepartments();
      setDepartments(res.data.departments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleHeadLookup = async (q) => {
    setHeadSearch(q);
    if (!q || q.length < 2) {
      setHeadResults([]);
      return;
    }
    try {
      const res = await userLookup({ q });
      setHeadResults(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setFormData({ name: '', code: '', headUserId: '' });
    setHeadSearch('');
    setHeadResults([]);
    setActionError('');
    setShowCreateModal(true);
  };

  const openEdit = (dept) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      headUserId: dept.headUserId?._id || dept.headUserId || '',
    });
    setHeadSearch(dept.headUserId?.name || '');
    setHeadResults([]);
    setActionError('');
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await createAdminDepartment({
        name: formData.name,
        code: formData.code.toUpperCase(),
        headUserId: formData.headUserId || null,
      });
      setShowCreateModal(false);
      setActionSuccess('Department created successfully');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchDepartments();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await updateAdminDepartment(selectedDept._id, {
        name: formData.name,
        code: formData.code.toUpperCase(),
        headUserId: formData.headUserId || null,
      });
      setShowEditModal(false);
      setActionSuccess('Department updated successfully');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchDepartments();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update department');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure business units and designated departmental approval heads.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Grid of Departments */}
      {loading ? (
        <div className="py-12 bg-white rounded-xl border border-slate-200">
          <LoadingSpinner size="lg" message="Loading departments..." />
        </div>
      ) : departments.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm bg-white rounded-xl border border-slate-200">
          No departments configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {dept.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{dept.name}</h3>
                      <span className="text-xs text-slate-400">Code: {dept.code}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(dept)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                    title="Edit Department"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-xs">
                    <span className="text-slate-400 block mb-0.5 font-medium uppercase tracking-wider text-[10px]">
                      Head of Department
                    </span>
                    {dept.headUserId?.name ? (
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{dept.headUserId.name}</span>
                        <span className="text-slate-400 text-[11px]">({dept.headUserId.email})</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Not Assigned</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Status:</span>
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Department */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Department</h2>
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
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Engineering"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Department Code * (2-10 chars, uppercase)
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ENG"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Head of Department Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Head of Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={headSearch}
                    onChange={(e) => handleHeadLookup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.headUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, headUserId: '' });
                        setHeadSearch('');
                      }}
                      className="absolute right-2 top-2 text-xs text-rose-500 hover:text-rose-700"
                    >
                      Clear
                    </button>
                  )}
                  {headResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {headResults.map((u) => (
                        <div
                          key={u._id}
                          onClick={() => {
                            setFormData({ ...formData, headUserId: u._id });
                            setHeadSearch(`${u.name} (${u.email})`);
                            setHeadResults([]);
                          }}
                          className="p-2 text-xs hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{u.name}</span>
                            <span className="text-slate-400 ml-2">{u.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Department */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Edit Department</h2>
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
                  Department Name
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
                  Department Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              {/* Head of Department Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Head of Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search user..."
                    value={headSearch}
                    onChange={(e) => handleHeadLookup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.headUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, headUserId: '' });
                        setHeadSearch('');
                      }}
                      className="absolute right-2 top-2 text-xs text-rose-500 hover:text-rose-700"
                    >
                      Clear
                    </button>
                  )}
                  {headResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {headResults.map((u) => (
                        <div
                          key={u._id}
                          onClick={() => {
                            setFormData({ ...formData, headUserId: u._id });
                            setHeadSearch(`${u.name} (${u.email})`);
                            setHeadResults([]);
                          }}
                          className="p-2 text-xs hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{u.name}</span>
                            <span className="text-slate-400 ml-2">{u.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
    </div>
  );
}
