import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUnreadNotificationCount, getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/notifications';
import { Bell, User, LogOut, KeyRound, Shield, CheckCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { getDashboardRoute } from '../../utils/navigation';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const fetchUnread = async () => {
    try {
      const res = await getUnreadNotificationCount();
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // ignore polling errors
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s polling per spec
    return () => clearInterval(interval);
  }, []);

  const openNotifications = async () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen) {
      try {
        const res = await getNotifications({ limit: 10 });
        setNotifications(res.data.items || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.readAt) {
        await markNotificationRead(notif._id);
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotificationsOpen(false);
      if (notif.requestId) {
        navigate(`/requests/${notif.requestId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((items) =>
        items.map((i) => ({ ...i, readAt: new Date().toISOString() }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <Link to={getDashboardRoute(user)} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-700 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          PF
        </div>
        <div>
          <span className="font-bold text-slate-900 tracking-tight text-lg">ProofFlow</span>
          <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded">
            Nexora Technologies
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={openNotifications}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full min-w-[16px] text-center leading-none animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Flyout */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 text-sm cursor-pointer hover:bg-slate-50 transition-colors ${
                        !n.readAt ? 'bg-indigo-50/50 font-medium' : ''
                      }`}
                    >
                      <p className="text-slate-800 text-xs leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
            <div className="text-xs text-slate-500">{user?.roles?.join(', ')}</div>
          </div>

          <button
            onClick={() => navigate('/change-password')}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            title="Change Password"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          <button
            onClick={logout}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
