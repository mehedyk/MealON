// ============================================================
// src/pages/DashboardPage.jsx
// ============================================================
import React from 'react';
import {
  Users, UtensilsCrossed, Wallet, TrendingUp,
  Copy, Check, RefreshCw, AlertCircle,
  ArrowRight, ChefHat,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDashboardStats, useRecentExpenses, useTodayMeals } from '../hooks/useMess';
import { Spinner, Empty } from '../components/ui';

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.bg}`}>
          <Icon className={`w-4 h-4 ${color.text}`} />
        </div>
        {loading && <Spinner />}
      </div>
      <p className="text-white/40 text-xs font-body mb-1">{label}</p>
      <p className="font-display text-2xl font-bold text-white leading-none mb-1">
        {loading ? '—' : value}
      </p>
      {sub && <p className="text-white/30 text-xs">{sub}</p>}
    </div>
  );
}

// ── Category badge colors ─────────────────────────────────────
const CAT_COLORS = {
  grocery:     'badge-green',
  utility:     'badge-blue',
  maintenance: 'badge-amber',
  cook:        'badge-amber',
  other:       'text-white/40 bg-white/5 border border-white/10',
};

// ── Greeting based on time ────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { member, mess } = useAuthStore();
  const [codeCopied, setCodeCopied] = useState(false);

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  const { data: recentExpenses = [], isLoading: expLoading } = useRecentExpenses();
  const { data: todayMeals = [], isLoading: mealsLoading } = useTodayMeals();

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(mess?.mess_code || '');
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {}
  };

  const todayDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-white/40 text-sm font-body">{todayDate}</p>
          <h1 className="font-display text-2xl font-bold text-white mt-0.5">
            {getGreeting()}, {member?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Mess code chip */}
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-800 border border-white/[0.07] hover:border-brand-500/30 transition group"
            title="Copy mess code to share"
          >
            <div>
              <p className="text-[10px] text-white/25 font-body text-left">Mess Code</p>
              <p className="font-display font-bold text-brand-400 tracking-[0.25em] text-sm leading-none">
                {mess?.mess_code}
              </p>
            </div>
            {codeCopied
              ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              : <Copy className="w-3.5 h-3.5 text-white/25 group-hover:text-brand-400 transition shrink-0" />
            }
          </button>
          <button
            onClick={() => refetchStats()}
            className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/40 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Error state ── */}
      {statsError && (
        <div className="alert-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load stats. <button onClick={() => refetchStats()} className="underline">Try again</button></span>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          label="Members"
          value={stats?.memberCount ?? '—'}
          sub="active in mess"
          color={{ bg: 'bg-blue-500/10', text: 'text-blue-400' }}
          loading={statsLoading}
        />
        <StatCard
          icon={UtensilsCrossed}
          label="Meals This Month"
          value={stats?.totalMeals ?? '—'}
          sub={stats?.month}
          color={{ bg: 'bg-emerald-500/10', text: 'text-emerald-400' }}
          loading={statsLoading}
        />
        <StatCard
          icon={Wallet}
          label="Expenses This Month"
          value={stats ? `৳${parseFloat(stats.totalExpenses).toLocaleString('en-IN')}` : '—'}
          sub={stats?.month}
          color={{ bg: 'bg-brand-500/10', text: 'text-brand-400' }}
          loading={statsLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Meal Rate"
          value={stats ? `৳${stats.mealRate}` : '—'}
          sub="per meal this month"
          color={{ bg: 'bg-purple-500/10', text: 'text-purple-400' }}
          loading={statsLoading}
        />
      </div>

      {/* ── Bottom two columns ── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* ── Recent Expenses ── */}
        <div className="card">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.05]">
            <h2 className="font-display font-semibold text-white text-sm">Recent Expenses</h2>
            <Link to="/app/expenses" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {expLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : recentExpenses.length === 0 ? (
              <Empty
                icon={Wallet}
                title="No expenses yet"
                description="Add your first expense to start tracking."
                action={
                  <Link to="/app/expenses" className="btn-primary text-xs px-4 py-2">
                    Add Expense
                  </Link>
                }
              />
            ) : (
              recentExpenses.map((exp) => (
                <div key={exp.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{exp.description}</p>
                    <p className="text-xs text-white/35 mt-0.5">
                      {exp.paid_by_member?.name} · {new Date(exp.expense_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`badge text-[10px] ${CAT_COLORS[exp.category] || CAT_COLORS.other}`}>
                      {exp.category}
                    </span>
                    <span className="font-display font-semibold text-white text-sm">
                      ৳{parseFloat(exp.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Today's Meals ── */}
        <div className="card">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.05]">
            <h2 className="font-display font-semibold text-white text-sm">
              Today's Meals
              <span className="ml-2 text-white/30 font-body font-normal text-xs">
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </h2>
            <Link to="/app/meals" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition">
              Log meals <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {mealsLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : todayMeals.length === 0 ? (
              <Empty
                icon={ChefHat}
                title="No meals logged today"
                description="Log today's meals for all members."
                action={
                  <Link to="/app/meals" className="btn-primary text-xs px-4 py-2">
                    Log Meals
                  </Link>
                }
              />
            ) : (
              todayMeals.map((meal) => {
                const count = (meal.breakfast ? 1 : 0) + (meal.lunch ? 1 : 0) + (meal.dinner ? 1 : 0);
                return (
                  <div key={meal.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                    <div className="w-7 h-7 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0">
                      <span className="text-brand-400 text-[10px] font-display font-bold">
                        {meal.member?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <p className="flex-1 text-sm text-white/80 truncate">{meal.member?.name}</p>
                    <div className="flex gap-1 shrink-0">
                      {[
                        { key: 'breakfast', label: 'B', active: meal.breakfast },
                        { key: 'lunch',     label: 'L', active: meal.lunch },
                        { key: 'dinner',    label: 'D', active: meal.dinner },
                      ].map(({ key, label, active }) => (
                        <span
                          key={key}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-display font-bold transition ${
                            active
                              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                              : 'bg-white/5 text-white/20 border border-white/5'
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                    <span className="text-white/30 text-xs w-8 text-right shrink-0">{count} meal{count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Role banner for managers ── */}
      {member?.role === 'manager' && (
        <div className="card p-4 border-brand-500/15 bg-brand-500/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
            <span className="text-brand-400 text-sm">★</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-display font-semibold text-white/80">You're the Manager</p>
            <p className="text-xs text-white/35 mt-0.5">You can add members, log expenses for others, and manage mess settings.</p>
          </div>
          <Link to="/app/members" className="btn-ghost text-xs shrink-0">
            Members <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
