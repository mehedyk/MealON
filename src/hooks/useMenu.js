// ============================================================
// src/hooks/useMenu.js
// TanStack Query hooks for the Menu Planner module.
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const MENU_KEYS = {
  week: (messId, startDate) => ['menu', messId, startDate],
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

// Returns array of 7 date strings starting from startDate (YYYY-MM-DD)
export function weekDates(startDate) {
  const dates = [];
  const d = new Date(`${startDate}T12:00:00`);
  for (let i = 0; i < 7; i++) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

// Monday of the week containing the given date
export function weekStart(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

// ── useWeekMenu: all menu items for a 7-day window ────────────
// Returns Map: `${date}-${mealType}` → [dish strings]
export function useWeekMenu(startDate) {
  const { mess } = useAuthStore();
  const dates = weekDates(startDate);
  const endDate = dates[dates.length - 1];

  return useQuery({
    queryKey: MENU_KEYS.week(mess?.id, startDate),
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, dish, meal_type, menu_date')
        .eq('mess_id', mess.id)
        .gte('menu_date', startDate)
        .lte('menu_date', endDate)
        .order('created_at');
      if (error) throw error;

      const map = new Map();
      for (const row of data ?? []) {
        const key = `${row.menu_date}-${row.meal_type}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({ id: row.id, dish: row.dish });
      }
      return map;
    },
  });
}

// ── useAddMenuItem ─────────────────────────────────────────────
export function useAddMenuItem() {
  const qc = useQueryClient();
  const { mess, member } = useAuthStore();

  return useMutation({
    mutationFn: async ({ dish, mealType, menuDate }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          mess_id:    mess.id,
          dish:       dish.trim(),
          meal_type:  mealType,
          menu_date:  menuDate,
          created_by: member.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const start = weekStart(data.menu_date);
      qc.invalidateQueries({ queryKey: MENU_KEYS.week(mess?.id, start) });
    },
  });
}

// ── useDeleteMenuItem ─────────────────────────────────────────
export function useDeleteMenuItem() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, menuDate }) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
        .eq('mess_id', mess.id);
      if (error) throw error;
      return menuDate;
    },
    onSuccess: (menuDate) => {
      const start = weekStart(menuDate);
      qc.invalidateQueries({ queryKey: MENU_KEYS.week(mess?.id, start) });
    },
  });
}

export { MEAL_TYPES };
