// ============================================================
// src/hooks/useMess.js
// TanStack Query hooks for mess data.
// All components pull data through here — no direct supabase
// calls scattered across pages.
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ── Keys ─────────────────────────────────────────────────────
export const KEYS = {
  members:  (messId) => ['members',  messId],
  meals:    (messId) => ['meals',    messId],
  expenses: (messId) => ['expenses', messId],
  deposits: (messId) => ['deposits', messId],
  stats:    (messId) => ['stats',    messId],
};

// ── Members ───────────────────────────────────────────────────
export function useMembers() {
  const { mess } = useAuthStore();
  return useQuery({
    queryKey: KEYS.members(mess?.id),
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('mess_id', mess.id)
        .eq('is_active', true)
        .order('role', { ascending: false }) // managers first
        .order('joined_at');
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Update member role ────────────────────────────────────────
export function useUpdateMemberRole() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();
  return useMutation({
    mutationFn: async ({ memberId, role }) => {
      const { error } = await supabase
        .from('members')
        .update({ role })
        .eq('id', memberId)
        .eq('mess_id', mess.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.members(mess?.id) }),
  });
}

// ── Remove member (soft delete) ───────────────────────────────
export function useRemoveMember() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();
  return useMutation({
    mutationFn: async (memberId) => {
      const { error } = await supabase
        .from('members')
        .update({ is_active: false })
        .eq('id', memberId)
        .eq('mess_id', mess.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.members(mess?.id) }),
  });
}

// ── Dashboard stats ───────────────────────────────────────────
export function useDashboardStats() {
  const { mess } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7); // YYYY-MM

  return useQuery({
    queryKey: KEYS.stats(mess?.id),
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const [membersRes, mealsRes, expensesRes] = await Promise.all([
        supabase
          .from('members')
          .select('id', { count: 'exact', head: true })
          .eq('mess_id', mess.id)
          .eq('is_active', true),

        supabase
          .from('meals')
          .select('breakfast, lunch, dinner')
          .eq('mess_id', mess.id)
          .gte('meal_date', `${thisMonth}-01`),

        supabase
          .from('expenses')
          .select('amount')
          .eq('mess_id', mess.id)
          .gte('expense_date', `${thisMonth}-01`),
      ]);

      const totalMeals = (mealsRes.data ?? []).reduce((acc, row) => {
        return acc + (row.breakfast ? 1 : 0) + (row.lunch ? 1 : 0) + (row.dinner ? 1 : 0);
      }, 0);

      const totalExpenses = (expensesRes.data ?? []).reduce(
        (acc, row) => acc + parseFloat(row.amount), 0
      );

      const mealRate = totalMeals > 0
        ? (totalExpenses / totalMeals).toFixed(2)
        : '0.00';

      return {
        memberCount: membersRes.count ?? 0,
        totalMeals,
        totalExpenses: totalExpenses.toFixed(2),
        mealRate,
        month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      };
    },
    staleTime: 1000 * 60, // 1 min
  });
}

// ── Recent expenses (last 5) ──────────────────────────────────
export function useRecentExpenses() {
  const { mess } = useAuthStore();
  return useQuery({
    queryKey: ['recent-expenses', mess?.id],
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, paid_by_member:paid_by(name)')
        .eq('mess_id', mess.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Today's meals ─────────────────────────────────────────────
export function useTodayMeals() {
  const { mess } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['today-meals', mess?.id, today],
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('*, member:member_id(name)')
        .eq('mess_id', mess.id)
        .eq('meal_date', today);
      if (error) throw error;
      return data ?? [];
    },
  });
}
