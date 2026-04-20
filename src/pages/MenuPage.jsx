// ============================================================
// src/pages/MenuPage.jsx
// Weekly menu planner.
// 7-column grid (Mon–Sun) × 3 rows (Breakfast/Lunch/Dinner).
// Any member can add dishes. Manager can delete.
// ============================================================
import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X,
  ScrollText, RefreshCw, Calendar,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  useWeekMenu, useAddMenuItem, useDeleteMenuItem,
  weekDates, weekStart, MEAL_TYPES,
} from '../hooks/useMenu';
import { Alert, Spinner } from '../components/ui';
import { sanitizeText } from '../utils/validate';

const MEAL_META = {
  breakfast: { label: 'Breakfast', emoji: '🌅', color: 'text-amber-400',   bg: 'bg-amber-500/8   border-amber-500/15' },
  lunch:     { label: 'Lunch',     emoji: '☀️',  color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/15' },
  dinner:    { label: 'Dinner',    emoji: '🌙', color: 'text-blue-400',    bg: 'bg-blue-500/8    border-blue-500/15' },
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Inline add-dish input shown per cell
function AddDishInput({ onAdd, loading }) {
  const [val, setVal] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const cleaned = sanitizeText(val);
    if (!cleaned || cleaned.length < 1) return;
    if (cleaned.length > 120) return;
    await onAdd(cleaned);
    setVal('');
  };

  return (
    <form onSubmit={submit} className="flex gap-1 mt-1.5">
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add dish…"
        maxLength={120}
        className="flex-1 min-w-0 text-[11px] bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-white/70 placeholder-white/20 focus:outline-none focus:border-brand-500/40 focus:ring-1 focus:ring-brand-500/20 transition"
      />
      <button
        type="submit"
        disabled={loading || !val.trim()}
        className="p-1.5 rounded-lg bg-brand-500/15 border border-brand-500/20 text-brand-400 hover:bg-brand-500/25 disabled:opacity-40 transition shrink-0"
      >
        {loading ? <Spinner /> : <Plus className="w-3 h-3" />}
      </button>
    </form>
  );
}

export default function MenuPage() {
  const { member } = useAuthStore();
  const isManager = member?.role === 'manager';
  const today = new Date().toISOString().split('T')[0];

  const [weekStartDate, setWeekStartDate] = useState(weekStart(today));
  const [cellError, setCellError] = useState('');

  const dates = weekDates(weekStartDate);
  const { data: menuMap, isLoading, refetch } = useWeekMenu(weekStartDate);
  const addItem = useAddMenuItem();
  const delItem = useDeleteMenuItem();

  const shiftWeek = (dir) => {
    const d = new Date(`${weekStartDate}T12:00:00`);
    d.setDate(d.getDate() + dir * 7);
    setWeekStartDate(d.toISOString().split('T')[0]);
  };

  const weekLabel = (() => {
    const s = new Date(`${dates[0]}T12:00:00`);
    const e = new Date(`${dates[6]}T12:00:00`);
    const opts = { day: 'numeric', month: 'short' };
    return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', opts)}`;
  })();

  const handleAdd = async (mealType, menuDate, dish) => {
    setCellError('');
    try {
      await addItem.mutateAsync({ dish, mealType, menuDate });
    } catch (err) {
      setCellError(err.message || 'Failed to add dish');
    }
  };

  const handleDelete = async (id, menuDate) => {
    setCellError('');
    try {
      await delItem.mutateAsync({ id, menuDate });
    } catch (err) {
      setCellError(err.message || 'Failed to remove dish');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Menu Planner</h1>
          <p className="text-white/40 text-sm mt-0.5">Plan what's cooking every day of the week.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Week navigator */}
          <button onClick={() => shiftWeek(-1)} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-800 border border-white/[0.07]">
            <Calendar className="w-3.5 h-3.5 text-white/30" />
            <span className="font-display text-white/70 text-sm">{weekLabel}</span>
          </div>
          <button onClick={() => shiftWeek(1)} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white transition">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => { setWeekStartDate(weekStart(today)); }} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white transition" title="Jump to today">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {cellError && <Alert type="error">{cellError}</Alert>}

      {/* ── Weekly grid ── */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="md" /></div>
      ) : (
        <div className="card overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-white/[0.05]">
            {/* Meal type label column */}
            <div className="border-r border-white/[0.05]" />
            {dates.map((dateStr, i) => {
              const isToday = dateStr === today;
              const d = new Date(`${dateStr}T12:00:00`);
              return (
                <div
                  key={dateStr}
                  className={`px-2 py-3 text-center border-r border-white/[0.04] last:border-r-0 ${
                    isToday ? 'bg-brand-500/8' : ''
                  }`}
                >
                  <p className={`font-display font-semibold text-xs ${isToday ? 'text-brand-400' : 'text-white/50'}`}>
                    {DAY_LABELS[i]}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${isToday ? 'text-brand-300/70' : 'text-white/25'}`}>
                    {d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  {isToday && <div className="w-1 h-1 rounded-full bg-brand-400 mx-auto mt-1" />}
                </div>
              );
            })}
          </div>

          {/* Meal rows */}
          {MEAL_TYPES.map((mealType) => {
            const meta = MEAL_META[mealType];
            return (
              <div key={mealType} className="grid grid-cols-8 border-b border-white/[0.04] last:border-b-0">
                {/* Meal type label */}
                <div className={`flex flex-col items-center justify-center gap-1 px-1 py-3 border-r border-white/[0.05] ${meta.bg} border`}>
                  <span className="text-base leading-none">{meta.emoji}</span>
                  <span className={`font-display font-semibold text-[10px] ${meta.color} leading-none`}>{meta.label}</span>
                </div>

                {/* Day cells */}
                {dates.map((dateStr) => {
                  const key   = `${dateStr}-${mealType}`;
                  const items = menuMap?.get(key) ?? [];
                  const isToday   = dateStr === today;

                  return (
                    <div
                      key={dateStr}
                      className={`px-2 py-2 border-r border-white/[0.04] last:border-r-0 min-h-[88px] ${
                        isToday ? 'bg-brand-500/[0.04]' : ''
                      }`}
                    >
                      {/* Dish chips */}
                      <div className="space-y-1">
                        {items.map(({ id, dish }) => (
                          <div
                            key={id}
                            className="group flex items-start gap-1 bg-white/[0.04] rounded-lg px-2 py-1.5 border border-white/[0.06] hover:border-white/[0.12] transition"
                          >
                            <span className="text-white/70 text-[11px] leading-tight flex-1 min-w-0 break-words">
                              {dish}
                            </span>
                            {isManager && (
                              <button
                                onClick={() => handleDelete(id, dateStr)}
                                disabled={delItem.isPending}
                                className="shrink-0 text-white/20 hover:text-red-400 transition opacity-0 group-hover:opacity-100 mt-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add input — all members can add */}
                      <AddDishInput
                        onAdd={(dish) => handleAdd(mealType, dateStr, dish)}
                        loading={addItem.isPending}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Instructions */}
      <p className="text-white/20 text-xs text-center">
        Any member can add dishes · {isManager ? 'Managers can remove dishes' : 'Only managers can remove dishes'} · Click the + to add a dish to any slot
      </p>
    </div>
  );
}
