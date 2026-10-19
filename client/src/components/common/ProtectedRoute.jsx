import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, requiredRole, approverOnly, adminOnly }) {
  const { user, loading, isAdmin, isApprover, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Authenticating session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password change if required and not already on the change password page
  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  if (approverOnly && !isApprover && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  if (requiredRole && !hasRole(requiredRole) && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  return children;
}
