// ============================================================
// src/App.jsx
// ============================================================
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { PageLoader } from './components/ui';

// Pages
import LandingPage   from './pages/LandingPage';
import AuthPage      from './pages/AuthPage';
import AppShell      from './pages/AppShell';
import TermsPage     from './pages/TermsPage';
import PrivacyPage   from './pages/PrivacyPage';
import NotFoundPage  from './pages/NotFoundPage';

// Auth guard
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  const { initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Wait for initial session resolution before rendering routes
  // (prevents flash of /auth redirect for logged-in users)
  if (loading) return <PageLoader />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/"        element={<LandingPage />} />
      <Route path="/auth"    element={<AuthPage />} />
      <Route path="/terms"   element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Protected app */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app/*" element={<AppShell />} />
      </Route>

      {/* Fallbacks */}
      <Route path="/auth/verify" element={<Navigate to="/auth" replace />} />
      <Route path="/auth/reset"  element={<Navigate to="/auth" replace />} />
      <Route path="*"            element={<NotFoundPage />} />
    </Routes>
  );
}
