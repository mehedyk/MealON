// ============================================================
// src/components/layout/AppLayout.jsx
// The persistent shell for all authenticated pages.
// Sidebar on desktop, bottom nav on mobile.
// ============================================================
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, Wallet, Users,
  BookOpen, BarChart3, Settings, LogOut,
  Menu as MenuIcon, X, Copy, Check, ScrollText, Vote,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Logo } from '../ui';

const NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/meals',     icon: UtensilsCrossed, label: 'Meals'      },
  { to: '/app/expenses',  icon: Wallet,          label: 'Expenses'   },
  { to: '/app/members',   icon: Users,           label: 'Members'    },
  { to: '/app/menu',      icon: ScrollText,      label: 'Menu'       },
  { to: '/app/rules',     icon: BookOpen,        label: 'Rules'      },
  { to: '/app/voting',    icon: Vote,            label: 'Voting'     },
  { to: '/app/reports',   icon: BarChart3,       label: 'Reports'    },
  { to: '/app/settings',  icon: Settings,        label: 'Settings'   },
];

// Mobile bottom nav — most-used 5
const MOBILE_NAV = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Home'     },
  { to: '/app/meals',     icon: UtensilsCrossed, label: 'Meals'    },
  { to: '/app/expenses',  icon: Wallet,          label: 'Expenses' },
  { to: '/app/members',   icon: Users,           label: 'Members'  },
  { to: '/app/settings',  icon: Settings,        label: 'More'     },
];

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [codeCopied,  setCodeCopied]  = useState(false);
  const { mess, member, user, signOut } = useAuthStore();
  const navigate = useNavigate();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(mess?.mess_code || '');
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {}
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const initials = (member?.name || user?.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-surface-900 border-r border-white/[0.06]
          flex flex-col transition-transform duration-300 ease-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] shrink-0">
          <Logo size="sm" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/40 hover:text-white transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mess info pill */}
        <div className="px-4 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between gap-2 bg-surface-800 rounded-xl px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-xs text-white/30 font-body mb-0.5">Current Mess</p>
              <p className="text-sm font-display font-semibold text-white truncate">{mess?.name}</p>
            </div>
            <button
              onClick={copyCode}
              className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 transition"
              title="Copy mess code"
            >
              <span className="font-display text-xs font-bold text-brand-400 tracking-wider">
                {mess?.mess_code}
              </span>
              {codeCopied
                ? <Check className="w-3 h-3 text-emerald-400" />
                : <Copy className="w-3 h-3 text-brand-400/60" />
              }
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body transition-all duration-150 group
                ${isActive
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-brand-400' : 'text-white/30 group-hover:text-white/60'}`} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User card at bottom */}
        <div className="px-3 pb-4 pt-2 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-display font-bold text-brand-400">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-semibold text-white truncate">{member?.name}</p>
              <p className="text-[10px] text-white/30 capitalize truncate">{member?.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-white/30 hover:text-red-400 transition p-1"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top bar ── */}
        <header className="h-16 border-b border-white/[0.06] bg-surface-950/80 backdrop-blur-xl shrink-0 flex items-center px-4 sm:px-6 gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/50 hover:text-white transition p-1"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Page title slot — children can override via context if needed */}
          <div className="flex-1" />

          {/* Role badge */}
          <div className={`badge ${member?.role === 'manager' ? 'badge-amber' : 'badge-blue'} hidden sm:flex`}>
            {member?.role === 'manager' ? '★ Manager' : 'Member'}
          </div>
        </header>

        {/* ── Scrollable page content ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-900/95 backdrop-blur-xl border-t border-white/[0.07] px-2 pb-safe">
        <div className="flex items-center justify-around h-16">
          {MOBILE_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all
                ${isActive ? 'text-brand-400' : 'text-white/35 hover:text-white/70'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-400' : ''}`} />
                  <span className="text-[10px] font-body">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  );
}
