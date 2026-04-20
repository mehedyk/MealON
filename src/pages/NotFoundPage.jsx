// ============================================================
// src/pages/NotFoundPage.jsx
// ============================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Logo } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="page min-h-screen flex flex-col items-center justify-center text-center px-6">
      <Logo size="md" className="mb-10" />
      <div className="font-display text-8xl font-bold text-white/5 mb-2 select-none">404</div>
      <h1 className="font-display text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-white/40 text-sm mb-8 max-w-xs">
        This page doesn't exist or you may not have permission to view it.
      </p>
      <Link to="/" className="btn-primary">
        <Home className="w-4 h-4" /> Go Home
      </Link>
    </div>
  );
}
