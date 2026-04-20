// ============================================================
// src/pages/ReportsPage.jsx
//
// Monthly report with:
//  - Expense breakdown bar chart (by category)
//  - Per-member meals bar chart
//  - Daily expense trend line chart
//  - Full summary table (members × meals/share/paid/balance)
//  - Print / save-as-PDF via window.print()
// ============================================================
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
  ChevronLeft, ChevronRight, Printer,
  BarChart3, TrendingUp, UtensilsCrossed, Wallet,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMembers } from '../hooks/useMess';
import { useBalanceSheet } from '../hooks/useExpenses';
import { useMonthlySummary, daysInMonth } from '../hooks/useMeals';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '../components/ui';

// ── Colour palette per category ──────────────────────────────
const CAT_COLORS = {
  grocery:     '#34d399',
  utility:     '#60a5fa',
  maintenance: '#f59e0b',
  cook:        '#a78bfa',
  other:       '#94a3b8',
};

// ── Custom tooltip ────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label, prefix = '৳' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-white/[0.1] rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-display font-semibold">
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : p.value}
        </p>
      ))}
    </div>
  );
};

const MealTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-white/[0.1] rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-display font-semibold">
          {p.name}: {p.value} meals
        </p>
      ))}
    </div>
  );
};

// ── Month navigator ───────────────────────────────────────────
function MonthNav({ yearMonth, onChange }) {
  const label = new Date(`${yearMonth}-15`).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const isCurrent = yearMonth === new Date().toISOString().slice(0, 7);
  const shift = (dir) => {
    const d = new Date(`${yearMonth}-15`);
    d.setMonth(d.getMonth() + dir);
    const nm = d.toISOString().slice(0, 7);
    if (dir > 0 && nm > new Date().toISOString().slice(0, 7)) return;
    onChange(nm);
  };
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => shift(-1)} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white transition">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-display font-semibold text-white text-sm min-w-[144px] text-center">{label}</span>
      <button onClick={() => shift(1)} disabled={isCurrent} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Fetch daily expenses for trend line ───────────────────────
function useDailyExpenses(yearMonth) {
  const { mess } = useAuthStore();
  const firstDay = `${yearMonth}-01`;
  const lastDay  = `${yearMonth}-${String(daysInMonth(yearMonth)).padStart(2, '0')}`;

  return useQuery({
    queryKey: ['daily-expenses', mess?.id, yearMonth],
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('expense_date, amount, category')
        .eq('mess_id', mess.id)
        .gte('expense_date', firstDay)
        .lte('expense_date', lastDay)
        .order('expense_date');
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="card p-5 print:border print:border-gray-200 print:shadow-none">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${accent.bg}`}>
        <Icon className={`w-4 h-4 ${accent.text}`} />
      </div>
      <p className="text-white/40 text-xs print:text-gray-500">{label}</p>
      <p className={`font-display font-bold text-xl mt-0.5 ${accent.text}`}>{value}</p>
      {sub && <p className="text-white/25 text-xs mt-0.5 print:text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Chart section wrapper ─────────────────────────────────────
function ChartSection({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`card p-5 print:border print:border-gray-200 print:shadow-none ${className}`}>
      <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2 mb-5 print:text-gray-800">
        <Icon className="w-4 h-4 text-brand-400 print:hidden" />
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ReportsPage() {
  const { mess } = useAuthStore();
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: members = [], isLoading: mLoading } = useMembers();
  const { data: sheet,         isLoading: sLoading } = useBalanceSheet(yearMonth, members);
  const { data: mealSummary,   isLoading: msLoading } = useMonthlySummary(yearMonth);
  const { data: dailyExp = [],  isLoading: dLoading } = useDailyExpenses(yearMonth);

  const isLoading = mLoading || sLoading || msLoading || dLoading;

  const month = new Date(`${yearMonth}-15`).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // ── Derived chart data ─────────────────────────────────────

  // Expense by category
  const catData = useMemo(() => {
    const map = {};
    for (const row of dailyExp) {
      map[row.category] = (map[row.category] ?? 0) + parseFloat(row.amount);
    }
    return Object.entries(map).map(([cat, total]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      amount: parseFloat(total.toFixed(2)),
      fill: CAT_COLORS[cat] ?? '#94a3b8',
    }));
  }, [dailyExp]);

  // Per-member meals bar chart
  const memberMealData = useMemo(() => {
    return members.map((m) => ({
      name: m.name.split(' ')[0],   // first name only for chart
      Breakfast: mealSummary?.[m.id]?.breakfast ?? 0,
      Lunch:     mealSummary?.[m.id]?.lunch     ?? 0,
      Dinner:    mealSummary?.[m.id]?.dinner    ?? 0,
    }));
  }, [members, mealSummary]);

  // Daily expense trend (cumulative running total)
  const trendData = useMemo(() => {
    const byDay = {};
    for (const row of dailyExp) {
      const day = parseInt(row.expense_date.split('-')[2], 10);
      byDay[day] = (byDay[day] ?? 0) + parseFloat(row.amount);
    }
    let running = 0;
    const days = daysInMonth(yearMonth);
    return Array.from({ length: days }, (_, i) => {
      running += byDay[i + 1] ?? 0;
      return { day: i + 1, total: parseFloat(running.toFixed(2)) };
    });
  }, [dailyExp, yearMonth]);

  const handlePrint = () => window.print();

  return (
    <>
      {/* ── Print styles injected into document head ── */}
      <style>{`
        @media print {
          body { background: white !important; color: #111 !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .card { background: white !important; }
        }
      `}</style>

      <div className="p-4 sm:p-6 space-y-5 animate-fade-in">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Reports</h1>
            <p className="text-white/40 text-sm mt-0.5">Monthly summary and analytics for {mess?.name}.</p>
          </div>
          <div className="flex items-center gap-2">
            <MonthNav yearMonth={yearMonth} onChange={setYearMonth} />
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/60 hover:text-white hover:border-white/20 text-sm transition"
              title="Save as PDF or print"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Print header — only shows when printing */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{mess?.name} — Monthly Report</h1>
          <p className="text-gray-500 text-sm mt-1">{month} · Generated {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <hr className="mt-3 border-gray-200" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Wallet}          label="Total Expenses"  value={sheet ? `৳${sheet.totalExpenses.toLocaleString('en-IN')}` : '৳0'}   sub={month} accent={{ bg: 'bg-brand-500/10',   text: 'text-brand-400'   }} />
              <StatCard icon={UtensilsCrossed} label="Total Meals"     value={sheet?.totalMeals ?? 0}                                               sub={`${members.length} members`} accent={{ bg: 'bg-emerald-500/10', text: 'text-emerald-400' }} />
              <StatCard icon={TrendingUp}      label="Meal Rate"       value={sheet?.mealRate > 0 ? `৳${sheet.mealRate.toFixed(2)}` : '—'}         sub="per meal" accent={{ bg: 'bg-purple-500/10',  text: 'text-purple-400'  }} />
              <StatCard icon={BarChart3}       label="Expense Entries" value={dailyExp.length}                                                       sub={month} accent={{ bg: 'bg-blue-500/10',   text: 'text-blue-400'    }} />
            </div>

            {/* ── Charts row ── */}
            <div className="grid lg:grid-cols-2 gap-4">

              {/* Expense by category */}
              <ChartSection title="Expenses by Category" icon={Wallet}>
                {catData.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-8">No expenses this month.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={catData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} name="Amount">
                        {catData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartSection>

              {/* Per-member meals */}
              <ChartSection title="Meals per Member" icon={UtensilsCrossed}>
                {memberMealData.every((m) => m.Breakfast + m.Lunch + m.Dinner === 0) ? (
                  <p className="text-white/30 text-sm text-center py-8">No meals logged this month.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={memberMealData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<MealTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }} />
                      <Bar dataKey="Breakfast" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Lunch"     stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Dinner"    stackId="a" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartSection>
            </div>

            {/* ── Cumulative expense trend ── */}
            <ChartSection title="Cumulative Expense Trend" icon={TrendingUp}>
              {dailyExp.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">No expenses this month.</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trendData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      interval={4}
                      tickFormatter={(v) => `${v}`}
                    />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'rgba(245,158,11,0.3)', strokeWidth: 1 }} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartSection>

            {/* ── Balance / summary table ── */}
            <div className="card overflow-hidden print-break">
              <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-white/[0.05]">
                <FileText className="w-4 h-4 text-brand-400 no-print" />
                <h3 className="font-display font-semibold text-white text-sm print:text-gray-800">
                  Member Summary — {month}
                </h3>
              </div>

              {!sheet || sheet.rows.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">No data for this month.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.04] print:border-gray-200">
                        {['Member', 'Meals', 'Meal Share (৳)', 'Expenses Paid (৳)', 'Deposited (৳)', 'Balance (৳)', 'Status'].map((h) => (
                          <th key={h} className="px-4 sm:px-5 py-2.5 text-left font-display font-medium text-white/30 text-xs whitespace-nowrap print:text-gray-500">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03] print:divide-gray-100">
                      {sheet.rows.map(({ member, meals, share, paid, deposited, balance }) => (
                        <tr key={member.id} className="hover:bg-white/[0.02] transition print:hover:bg-transparent">
                          <td className="px-4 sm:px-5 py-3 text-white/80 font-body print:text-gray-800">{member.name}</td>
                          <td className="px-4 sm:px-5 py-3 text-white/50 font-display print:text-gray-600">{meals}</td>
                          <td className="px-4 sm:px-5 py-3 text-white/50 font-display print:text-gray-600">{share.toFixed(2)}</td>
                          <td className="px-4 sm:px-5 py-3 text-white/50 font-display print:text-gray-600">{paid.toFixed(2)}</td>
                          <td className="px-4 sm:px-5 py-3 text-white/50 font-display print:text-gray-600">{deposited.toFixed(2)}</td>
                          <td className="px-4 sm:px-5 py-3">
                            <span className={`font-display font-bold text-sm ${
                              balance > 0.01 ? 'text-emerald-400 print:text-green-600' :
                              balance < -0.01 ? 'text-red-400 print:text-red-600' :
                              'text-white/30 print:text-gray-400'
                            }`}>
                              {balance > 0 ? '+' : ''}{balance.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <span className={`badge text-[10px] border ${
                              balance > 0.01  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              balance < -0.01 ? 'bg-red-500/10    text-red-400    border-red-500/20' :
                                               'bg-white/5        text-white/30   border-white/10'
                            }`}>
                              {balance > 0.01 ? 'Credit' : balance < -0.01 ? 'Owes' : 'Settled'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-white/[0.07] bg-white/[0.02] print:border-gray-200 print:bg-gray-50">
                        <td className="px-4 sm:px-5 py-3 font-display font-semibold text-white/40 text-xs uppercase tracking-wider print:text-gray-500">Totals</td>
                        <td className="px-4 sm:px-5 py-3 font-display font-bold text-brand-400 print:text-amber-600">{sheet.totalMeals}</td>
                        <td className="px-4 sm:px-5 py-3 font-display font-bold text-brand-400 print:text-amber-600">{sheet.totalExpenses.toFixed(2)}</td>
                        <td colSpan={4} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Print footer */}
            <div className="hidden print:block mt-6 pt-4 border-t border-gray-200 text-xs text-gray-400 text-center">
              Generated by MealON · {mess?.name} · Mess Code: {mess?.mess_code}
            </div>
          </>
        )}
      </div>
    </>
  );
}
