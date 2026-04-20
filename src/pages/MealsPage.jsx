// ============================================================
// src/pages/MealsPage.jsx
//
// Three sections:
//  1. Month navigator + quick-log form (today's meals)
//  2. Monthly grid: members × days, each cell = B/L/D chips
//  3. Monthly summary table: per-member totals + meal rate
// ============================================================
import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, UtensilsCrossed,
  RefreshCw, Info,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMembers } from '../hooks/useMess';
import {
  useMonthMeals, useMonthlySummary, useUpsertMeal, useDeleteMeal,
  toDateStr, toMonthStr, daysInMonth, countMeals,
} from '../hooks/useMeals';
import { Alert, Spinner, Empty } from '../components/ui';
import { validateDate } from '../utils/validate';
import { supabase } from '../lib/supabase';

// ── Constants ─────────────────────────────────────────────────
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const MEAL_LABELS = { breakfast: 'B', lunch: 'L', dinner: 'D' };
const MEAL_COLORS = {
  active:   'bg-brand-500/20 text-brand-300 border-brand-500/30',
  inactive: 'bg-white/[0.04] text-white/20 border-white/[0.06]',
};

// ── Month navigator ───────────────────────────────────────────
function MonthNav({ yearMonth, onChange }) {
  const label = new Date(`${yearMonth}-15`).toLocaleString('en-US', {
    month: 'long', year: 'numeric',
  });
  const isCurrentMonth = yearMonth === toMonthStr(new Date());

  const prev = () => {
    const d = new Date(`${yearMonth}-15`);
    d.setMonth(d.getMonth() - 1);
    onChange(toMonthStr(d));
  };
  const next = () => {
    const d = new Date(`${yearMonth}-15`);
    d.setMonth(d.getMonth() + 1);
    // Don't go beyond current month
    if (toMonthStr(d) <= toMonthStr(new Date())) onChange(toMonthStr(d));
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={prev} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white hover:border-white/20 transition">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-display font-semibold text-white text-sm min-w-[140px] text-center">{label}</span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white hover:border-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Quick log form — log for a single member on a date ────────
function LogMealForm({ members, currentMember, isManager, yearMonth }) {
  const today = toDateStr(new Date());
  const [date,      setDate]      = useState(today);
  const [memberId,  setMemberId]  = useState(String(currentMember?.id || ''));
  const [breakfast, setBreakfast] = useState(false);
  const [lunch,     setLunch]     = useState(false);
  const [dinner,    setDinner]    = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  const upsert = useUpsertMeal();

  // Date must be within the currently viewed month
  const minDate = `${yearMonth}-01`;
  const maxDate = `${yearMonth}-${String(daysInMonth(yearMonth)).padStart(2, '0')}`;

  // Reset date when month changes
  React.useEffect(() => {
    if (today >= minDate && today <= maxDate) setDate(today);
    else setDate(minDate);
  }, [yearMonth]);

  const handleToggle = (type) => {
    if (type === 'breakfast') setBreakfast(v => !v);
    if (type === 'lunch')     setLunch(v => !v);
    if (type === 'dinner')    setDinner(v => !v);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    setSuccess('');

    // Validate
    const dv = validateDate(date, { allowFuture: false });
    if (!dv.ok) { setError(dv.message); return; }
    if (date < minDate || date > maxDate) { setError('Date must be within the selected month'); return; }
    if (!memberId)        { setError('Select a member'); return; }
    if (!breakfast && !lunch && !dinner) { setError('Select at least one meal'); return; }

    // Non-managers can only log for themselves
    const targetId = isManager ? parseInt(memberId, 10) : currentMember.id;
    if (!isManager && targetId !== currentMember.id) {
      setError('You can only log meals for yourself');
      return;
    }

    try {
      await upsert.mutateAsync({
        memberId:  targetId,
        mealDate:  date,
        breakfast, lunch, dinner,
      });
      setSuccess('Meal logged successfully!');
      setBreakfast(false);
      setLunch(false);
      setDinner(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to log meal');
    }
  };

  return (
    <div className="card p-5">
      <h2 className="font-display font-semibold text-white text-sm mb-4">Log Meal</h2>

      {error   && <Alert type="error"   className="mb-4">{error}</Alert>}
      {success && <Alert type="success" className="mb-4">{success}</Alert>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {/* Date picker */}
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              min={minDate}
              max={maxDate > today ? today : maxDate}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Member select — manager sees all, member sees only self */}
          <div>
            <label className="label">Member</label>
            {isManager ? (
              <select
                className="input"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
              >
                <option value="">Select member…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            ) : (
              <div className="input flex items-center text-white/60">
                {currentMember?.name}
              </div>
            )}
          </div>

          {/* Meal toggles */}
          <div>
            <label className="label">Meals</label>
            <div className="flex gap-2">
              {MEAL_TYPES.map((type) => {
                const active = type === 'breakfast' ? breakfast : type === 'lunch' ? lunch : dinner;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleToggle(type)}
                    className={`flex-1 h-[46px] rounded-xl border font-display font-bold text-sm transition-all ${
                      active ? MEAL_COLORS.active : MEAL_COLORS.inactive
                    }`}
                    title={type.charAt(0).toUpperCase() + type.slice(1)}
                  >
                    {MEAL_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={upsert.isPending}
          className="btn-primary w-full sm:w-auto"
        >
          {upsert.isPending ? <><Spinner /> Saving…</> : 'Save Meal'}
        </button>
      </form>
    </div>
  );
}

// ── Monthly grid ──────────────────────────────────────────────
// Members as rows, days as columns.
// Each cell: three tiny B/L/D chips.
function MealGrid({ yearMonth, members, mealsMap, isLoading, onCellClick, isManager, currentMember }) {
  const days = daysInMonth(yearMonth);
  const today = toDateStr(new Date());
  const dayNumbers = Array.from({ length: days }, (_, i) => i + 1);

  if (isLoading) return (
    <div className="card p-8 flex justify-center">
      <Spinner size="md" />
    </div>
  );

  if (members.length === 0) return (
    <Empty icon={UtensilsCrossed} title="No members yet" description="Add members to start tracking meals." />
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/[0.05]">
        <h2 className="font-display font-semibold text-white text-sm">Monthly Grid</h2>
        <div className="flex items-center gap-3 text-xs text-white/30">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-brand-500/20 border border-brand-500/30 inline-block" /> = meal logged
          </span>
        </div>
      </div>

      {/* Scrollable grid wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-xs">
          <thead>
            <tr className="border-b border-white/[0.05]">
              {/* Member name column */}
              <th className="sticky left-0 bg-surface-900 z-10 px-4 py-2.5 text-left font-display font-medium text-white/40 text-xs min-w-[120px]">
                Member
              </th>
              {dayNumbers.map((d) => {
                const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
                const isToday = dateStr === today;
                return (
                  <th
                    key={d}
                    className={`px-1.5 py-2.5 font-display font-medium text-xs min-w-[36px] text-center ${
                      isToday ? 'text-brand-400' : 'text-white/25'
                    }`}
                  >
                    {d}
                  </th>
                );
              })}
              {/* Totals */}
              <th className="sticky right-0 bg-surface-900 z-10 px-3 py-2.5 text-right font-display font-medium text-white/40 text-xs min-w-[56px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {members.map((m) => {
              const canEdit = isManager || m.id === currentMember?.id;
              let memberTotal = 0;

              return (
                <tr key={m.id} className="hover:bg-white/[0.015] transition group">
                  {/* Member name */}
                  <td className="sticky left-0 bg-surface-900 group-hover:bg-surface-850 z-10 px-4 py-2 transition">
                    <span className="text-white/70 font-body text-xs whitespace-nowrap">{m.name}</span>
                  </td>

                  {/* Day cells */}
                  {dayNumbers.map((d) => {
                    const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
                    const isFuture = dateStr > today;
                    const meal = mealsMap?.get(`${m.id}-${dateStr}`);
                    const count = countMeals(meal);
                    memberTotal += count;

                    return (
                      <td key={d} className="px-1 py-2">
                        <button
                          disabled={!canEdit || isFuture}
                          onClick={() => !isFuture && canEdit && onCellClick(m, dateStr, meal)}
                          className={`w-8 h-7 rounded-lg flex items-center justify-center gap-px transition-all ${
                            isFuture
                              ? 'cursor-not-allowed opacity-30'
                              : canEdit
                              ? 'hover:bg-white/10 cursor-pointer'
                              : 'cursor-default'
                          }`}
                          title={isFuture ? 'Future date' : `${m.name} — ${dateStr}`}
                        >
                          {meal ? (
                            // Show filled B/L/D micro-chips
                            <div className="flex gap-px">
                              {MEAL_TYPES.map((t) => (
                                <span
                                  key={t}
                                  className={`w-[7px] h-[7px] rounded-sm transition-colors ${
                                    meal[t] ? 'bg-brand-400' : 'bg-white/10'
                                  }`}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="w-5 h-1.5 rounded-full bg-white/[0.06]" />
                          )}
                        </button>
                      </td>
                    );
                  })}

                  {/* Row total */}
                  <td className="sticky right-0 bg-surface-900 group-hover:bg-surface-850 z-10 px-3 py-2 text-right transition">
                    <span className={`font-display font-semibold text-xs ${memberTotal > 0 ? 'text-brand-400' : 'text-white/20'}`}>
                      {memberTotal}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 border-t border-white/[0.04]">
        <p className="text-white/25 text-[10px]">
          Click a cell to edit that day's meals. B = Breakfast · L = Lunch · D = Dinner.
          {!isManager && ' You can only edit your own row.'}
        </p>
      </div>
    </div>
  );
}

// ── Cell editor modal ─────────────────────────────────────────
function CellModal({ member, dateStr, existing, onSave, onDelete, onClose, saving, deleting }) {
  const [breakfast, setBreakfast] = useState(existing?.breakfast ?? false);
  const [lunch,     setLunch]     = useState(existing?.lunch     ?? false);
  const [dinner,    setDinner]    = useState(existing?.dinner    ?? false);
  const [error, setError] = useState('');

  const dateLabel = new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });

  const handleSave = async () => {
    setError('');
    if (!breakfast && !lunch && !dinner) {
      setError('Select at least one meal, or delete this entry.');
      return;
    }
    await onSave({ breakfast, lunch, dinner });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-xs animate-fade-up">
        <h3 className="font-display font-bold text-white mb-0.5">{member.name}</h3>
        <p className="text-white/40 text-xs mb-5">{dateLabel}</p>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        <div className="flex gap-3 mb-6">
          {MEAL_TYPES.map((type) => {
            const active = type === 'breakfast' ? breakfast : type === 'lunch' ? lunch : dinner;
            const setter = type === 'breakfast' ? setBreakfast : type === 'lunch' ? setLunch : setDinner;
            return (
              <button
                key={type}
                onClick={() => setter((v) => !v)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border font-display font-bold transition-all ${
                  active ? MEAL_COLORS.active : MEAL_COLORS.inactive
                }`}
              >
                <span className="text-lg">{type === 'breakfast' ? '🌅' : type === 'lunch' ? '☀️' : '🌙'}</span>
                <span className="text-xs">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          {existing && (
            <button
              onClick={() => onDelete(existing.id)}
              disabled={deleting}
              className="btn-danger flex-1 text-xs"
            >
              {deleting ? <Spinner /> : 'Clear'}
            </button>
          )}
          <button onClick={onClose} className="btn-ghost flex-1 text-xs">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-xs">
            {saving ? <Spinner /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Monthly summary table ─────────────────────────────────────
function MonthlySummary({ yearMonth, members, summary, isLoading, totalExpenses }) {
  if (isLoading) return <div className="flex justify-center py-6"><Spinner /></div>;

  const grandTotal = members.reduce((acc, m) => acc + (summary?.[m.id]?.total ?? 0), 0);
  const mealRate   = grandTotal > 0 && totalExpenses > 0
    ? (totalExpenses / grandTotal).toFixed(2)
    : null;

  const month = new Date(`${yearMonth}-15`).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/[0.05]">
        <h2 className="font-display font-semibold text-white text-sm">
          Summary — {month}
        </h2>
        {mealRate && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Info className="w-3.5 h-3.5" />
            Meal rate: <span className="text-brand-400 font-display font-semibold">৳{mealRate}</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Member', 'Breakfast', 'Lunch', 'Dinner', 'Total Meals', mealRate && 'Est. Cost'].filter(Boolean).map((h) => (
                <th key={h} className="px-4 sm:px-5 py-2.5 text-left font-display font-medium text-white/35 text-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {members.map((m) => {
              const s = summary?.[m.id] ?? { breakfast: 0, lunch: 0, dinner: 0, total: 0 };
              const estCost = mealRate ? (s.total * parseFloat(mealRate)).toFixed(2) : null;
              return (
                <tr key={m.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 sm:px-5 py-3 text-white/80 font-body">{m.name}</td>
                  <td className="px-4 sm:px-5 py-3 text-white/50 font-display">{s.breakfast}</td>
                  <td className="px-4 sm:px-5 py-3 text-white/50 font-display">{s.lunch}</td>
                  <td className="px-4 sm:px-5 py-3 text-white/50 font-display">{s.dinner}</td>
                  <td className="px-4 sm:px-5 py-3">
                    <span className={`font-display font-bold text-sm ${s.total > 0 ? 'text-brand-400' : 'text-white/20'}`}>
                      {s.total}
                    </span>
                  </td>
                  {estCost !== null && (
                    <td className="px-4 sm:px-5 py-3 text-white/50 font-display text-xs">
                      ৳{estCost}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {/* Grand total row */}
          <tfoot>
            <tr className="border-t border-white/[0.07] bg-white/[0.02]">
              <td className="px-4 sm:px-5 py-3 font-display font-semibold text-white/50 text-xs uppercase tracking-wider">Total</td>
              <td colSpan={3} />
              <td className="px-4 sm:px-5 py-3">
                <span className="font-display font-bold text-brand-400">{grandTotal}</span>
              </td>
              {mealRate && (
                <td className="px-4 sm:px-5 py-3 font-display font-semibold text-white/50 text-xs">
                  ৳{totalExpenses?.toLocaleString('en-IN')}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {!mealRate && (
        <div className="px-4 sm:px-5 py-3 border-t border-white/[0.04]">
          <p className="text-white/25 text-xs flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Add expenses for this month to see the estimated cost per member.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function MealsPage() {
  const { member: currentMember, mess } = useAuthStore();
  const isManager = currentMember?.role === 'manager';

  const [yearMonth, setYearMonth]   = useState(toMonthStr(new Date()));
  const [cellModal, setCellModal]   = useState(null); // { member, dateStr, existing }
  const [globalError, setGlobalError] = useState('');

  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { data: mealsMap, isLoading: mealsLoading, refetch } = useMonthMeals(yearMonth);
  const { data: summary,  isLoading: summaryLoading }        = useMonthlySummary(yearMonth);

  // Get this month's total expenses for meal rate calculation
  const [monthExpenses, setMonthExpenses] = useState(null);
  React.useEffect(() => {
    if (!mess?.id) return;
    const firstDay = `${yearMonth}-01`;
    const lastDay  = `${yearMonth}-${String(daysInMonth(yearMonth)).padStart(2, '0')}`;
    supabase
      .from('expenses')
      .select('amount')
      .eq('mess_id', mess.id)
      .gte('expense_date', firstDay)
      .lte('expense_date', lastDay)
      .then(({ data }) => {
        const total = (data ?? []).reduce((acc, r) => acc + parseFloat(r.amount), 0);
        setMonthExpenses(total);
      });
  }, [yearMonth, mess?.id]);

  const upsert  = useUpsertMeal();
  const delMeal = useDeleteMeal();

  const handleCellClick = (member, dateStr, existing) => {
    setCellModal({ member, dateStr, existing: existing ?? null });
  };

  const handleCellSave = async ({ breakfast, lunch, dinner }) => {
    setGlobalError('');
    try {
      await upsert.mutateAsync({
        memberId:  cellModal.member.id,
        mealDate:  cellModal.dateStr,
        breakfast, lunch, dinner,
      });
      setCellModal(null);
    } catch (err) {
      setGlobalError(err.message || 'Failed to save');
    }
  };

  const handleCellDelete = async (mealId) => {
    setGlobalError('');
    try {
      await delMeal.mutateAsync({ mealId, mealDate: cellModal.dateStr });
      setCellModal(null);
    } catch (err) {
      setGlobalError(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Meals</h1>
          <p className="text-white/40 text-sm mt-0.5">Track daily meals for every member.</p>
        </div>
        <div className="flex items-center gap-2">
          <MonthNav yearMonth={yearMonth} onChange={setYearMonth} />
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/40 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {globalError && <Alert type="error">{globalError}</Alert>}

      {/* ── Log meal form ── */}
      {(isManager || members.some((m) => m.id === currentMember?.id)) && (
        <LogMealForm
          members={members}
          currentMember={currentMember}
          isManager={isManager}
          yearMonth={yearMonth}
        />
      )}

      {/* ── Monthly grid ── */}
      <MealGrid
        yearMonth={yearMonth}
        members={members}
        mealsMap={mealsMap}
        isLoading={membersLoading || mealsLoading}
        onCellClick={handleCellClick}
        isManager={isManager}
        currentMember={currentMember}
      />

      {/* ── Monthly summary ── */}
      <MonthlySummary
        yearMonth={yearMonth}
        members={members}
        summary={summary}
        isLoading={summaryLoading}
        totalExpenses={monthExpenses}
      />

      {/* ── Cell edit modal ── */}
      {cellModal && (
        <CellModal
          member={cellModal.member}
          dateStr={cellModal.dateStr}
          existing={cellModal.existing}
          onSave={handleCellSave}
          onDelete={handleCellDelete}
          onClose={() => setCellModal(null)}
          saving={upsert.isPending}
          deleting={delMeal.isPending}
        />
      )}
    </div>
  );
}
