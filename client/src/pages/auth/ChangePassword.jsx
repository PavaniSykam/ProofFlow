import React, { useState } from 'react';
import { changePassword } from '../../api/auth';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardRoute } from '../../utils/navigation';

export default function ChangePassword() {
  const { user, updateUser, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      // Synchronize in-memory auth context with the updated user
      const updatedUser = res.data?.user || (await refreshUser());
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      setSuccess(true);

      // Determine the user's role-appropriate dashboard route
      const destination = getDashboardRoute(updatedUser || user);
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Password update failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
          <p className="text-xs text-slate-500">Update your corporate login credentials</p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm mb-4">
          <Check className="w-4 h-4 shrink-0" />
          <span>Password changed successfully. Redirecting...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            New Password (min. 8 characters)
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer mt-2"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
