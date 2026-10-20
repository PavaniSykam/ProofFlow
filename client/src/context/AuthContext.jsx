import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, logout as apiLogout } from '../api/auth';

const AuthContext = createContext(null);

const APPROVER_ROLES = [
  'manager',
  'hr',
  'finance',
  'it',
  'procurement',
  'department_head',
  'administration',
  'executive',
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await getMe();
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    setUser(res.data.user);
    return res.data.user;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasRole = (role) => {
    if (!user) return false;
    if (role === 'employee') return true;
    return (user.roles || []).includes(role);
  };

  const isAdmin = hasRole('admin');
  const isApprover = (user?.roles || []).some((r) => APPROVER_ROLES.includes(r));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser: fetchUser,
        updateUser,
        hasRole,
        isAdmin,
        isApprover,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
