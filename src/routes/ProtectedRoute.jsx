import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDenied from '../components/common/AccessDenied';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, loading } = useAuth();

  // If session is initializing, show loading pulse rather than blank screen
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">Verifying session credentials...</p>
      </div>
    );
  }

  // If unauthenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not authorized for this specific route, show Access Denied
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (currentUser.role || '').toLowerCase().trim();
    const isAuthorized = allowedRoles.some((allowed) => {
      const allowedNormalized = (allowed || '').toLowerCase().trim();
      if (allowedNormalized === 'admin' || allowedNormalized === 'administrator') {
        return userRole === 'admin' || userRole === 'administrator';
      }
      return userRole === allowedNormalized;
    });

    if (!isAuthorized) {
      return <AccessDenied targetRole={allowedRoles} />;
    }
  }

  return children;
}
