// ============================================================
// src/pages/AppShell.jsx
// Authenticated app shell — routes to onboarding or full app.
// ============================================================
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/ui';
import AppLayout      from '../components/layout/AppLayout';
import OnboardingPage from './OnboardingPage';
import DashboardPage  from './DashboardPage';
import MembersPage    from './MembersPage';
import SettingsPage   from './SettingsPage';
import MealsPage      from './MealsPage';
import ExpensesPage  from './ExpensesPage';
import ReportsPage   from './ReportsPage';
import MenuPage      from './MenuPage';
import RulesPage     from './RulesPage';
import VotingPage    from './VotingPage';

export default function AppShell() {
  const { member, mess, loading } = useAuthStore();

  if (loading) return (
    <div className="page min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  // No mess yet → onboarding
  if (!mess || !member) return <OnboardingPage />;

  // Full app with layout
  return (
    <AppLayout>
      <Routes>
        <Route path="/"          element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members"   element={<MembersPage />} />
        <Route path="/settings"  element={<SettingsPage />} />
        <Route path="/meals"   element={<MealsPage />} />
        <Route path="/expenses"  element={<ExpensesPage />} />
        <Route path="/reports"   element={<ReportsPage />} />
        <Route path="/menu"      element={<MenuPage />} />
        <Route path="/rules"     element={<RulesPage />} />
        <Route path="/voting"    element={<VotingPage />} />
        <Route path="*"          element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}
