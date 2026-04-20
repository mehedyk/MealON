// ============================================================
// src/components/auth/ProtectedRoute.jsx
// Redirects unauthenticated users to /auth.
// ============================================================
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PageLoader } from '../ui';

export default function ProtectedRoute() {
  const { user, loading } = useAuthStore();

  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/auth" replace />;

  return <Outlet />;
}
