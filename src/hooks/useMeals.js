// src/hooks/useMeals.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const MEAL_KEYS = {
  month:   (messId, ym) => ['meals', messId, ym],
  summary: (messId, ym) => ['meals-summary', messId, ym],
};

export const toDateStr  = (d) => d.toISOString().split('T')[0];
export const toMonthStr = (d) => toDateStr(d).slice(0, 7);
export const daysInMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};
export const countMeals = (row) =>
  (row?.breakfast ? 1 : 0) + (row?.lunch ? 1 : 0) + (row?.dinner ? 1 : 0);

export function useMonthMeals(yearMonth) {
  const { mess } = useAuthStore();
  const firstDay = `${yearMonth}-01`;
  const lastDay  = `${yearMonth}-${String(daysInMonth(yearMonth)).padStart(2, '0')}`;

  return useQuery({
    queryKey: MEAL_KEYS.month(mess?.id, yearMonth),
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('id, member_id, meal_date, breakfast, lunch, dinner')
        .eq('mess_id', mess.id)
        .gte('meal_date', firstDay)
        .lte('meal_date', lastDay);
      if (error) throw error;
      const map = new Map();
      for (const row of data ?? []) {
        map.set(`${row.member_id}-${row.meal_date}`, row);
      }
      return map;
    },
    staleTime: 1000 * 30,
  });
}

export function useMonthlySummary(yearMonth) {
  const { mess } = useAuthStore();
  const firstDay = `${yearMonth}-01`;
  const lastDay  = `${yearMonth}-${String(daysInMonth(yearMonth)).padStart(2, '0')}`;

  return useQuery({
    queryKey: MEAL_KEYS.summary(mess?.id, yearMonth),
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('member_id, breakfast, lunch, dinner')
        .eq('mess_id', mess.id)
        .gte('meal_date', firstDay)
        .lte('meal_date', lastDay);
      if (error) throw error;
      const totals = {};
      for (const row of data ?? []) {
        if (!totals[row.member_id]) totals[row.member_id] = { breakfast: 0, lunch: 0, dinner: 0, total: 0 };
        totals[row.member_id].breakfast += row.breakfast ? 1 : 0;
        totals[row.member_id].lunch     += row.lunch     ? 1 : 0;
        totals[row.member_id].dinner    += row.dinner    ? 1 : 0;
        totals[row.member_id].total     += countMeals(row);
      }
      return totals;
    },
  });
}

export function useUpsertMeal() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();

  return useMutation({
    mutationFn: async ({ memberId, mealDate, breakfast, lunch, dinner }) => {
      const { data, error } = await supabase
        .from('meals')
        .upsert(
          { mess_id: mess.id, member_id: memberId, meal_date: mealDate,
            breakfast: !!breakfast, lunch: !!lunch, dinner: !!dinner },
          { onConflict: 'member_id,meal_date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      const ym = vars.mealDate.slice(0, 7);
      qc.invalidateQueries({ queryKey: MEAL_KEYS.month(mess?.id, ym) });
      qc.invalidateQueries({ queryKey: MEAL_KEYS.summary(mess?.id, ym) });
      qc.invalidateQueries({ queryKey: ['stats', mess?.id] });
      qc.invalidateQueries({ queryKey: ['today-meals', mess?.id] });
    },
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();

  return useMutation({
    mutationFn: async ({ mealId, mealDate }) => {
      const { error } = await supabase
        .from('meals').delete().eq('id', mealId).eq('mess_id', mess.id);
      if (error) throw error;
      return mealDate;
    },
    onSuccess: (mealDate) => {
      const ym = mealDate.slice(0, 7);
      qc.invalidateQueries({ queryKey: MEAL_KEYS.month(mess?.id, ym) });
      qc.invalidateQueries({ queryKey: MEAL_KEYS.summary(mess?.id, ym) });
      qc.invalidateQueries({ queryKey: ['stats', mess?.id] });
      qc.invalidateQueries({ queryKey: ['today-meals', mess?.id] });
    },
  });
}
