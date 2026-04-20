// ============================================================
// src/hooks/useExpenses.js
// All data hooks for Expenses + Deposits + Balance sheet.
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ── Key factory ───────────────────────────────────────────────
export const EXP_KEYS = {
  list:     (messId, ym) => ['expenses', messId, ym],
  deposits: (messId, ym) => ['deposits', messId, ym],
  balance:  (messId, ym) => ['balance',  messId, ym],
};

// ── useExpenses: all expenses for a given month ───────────────
export function useExpenses(yearMonth) {
  const { mess } = useAuthStore();
  const firstDay = `${yearMonth}-01`;
  const lastDay  = lastOfMonth(yearMonth);

  return useQuery({
    queryKey: EXP_KEYS.list(mess?.id, yearMonth),
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, payer:paid_by(id, name)')
        .eq('mess_id', mess.id)
        .gte('expense_date', firstDay)
        .lte('expense_date', lastDay)
        .order('expense_date', { ascending: false })
        .order('created_at',   { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── useDeposits: all deposits for a given month ───────────────
export function useDeposits(yearMonth) {
  const { mess } = useAuthStore();
  const firstDay = `${yearMonth}-01`;
  const lastDay  = lastOfMonth(yearMonth);

  return useQuery({
    queryKey: EXP_KEYS.deposits(mess?.id, yearMonth),
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('deposits')
        .select('*, member:member_id(id, name)')
        .eq('mess_id', mess.id)
        .gte('deposit_date', firstDay)
        .lte('deposit_date', lastDay)
        .order('deposit_date', { ascending: false })
        .order('created_at',   { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── useBalanceSheet: per-member balance for a given month ─────
// balance = total deposited - share of expenses
// positive → member has credit remaining
// negative → member still owes
export function useBalanceSheet(yearMonth, members) {
  const { mess } = useAuthStore();
  const firstDay = `${yearMonth}-01`;
  const lastDay  = lastOfMonth(yearMonth);

  return useQuery({
    queryKey: EXP_KEYS.balance(mess?.id, yearMonth),
    enabled:  !!mess?.id && members?.length > 0,
    queryFn:  async () => {
      const [expRes, depRes, mealRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('paid_by, amount')
          .eq('mess_id', mess.id)
          .gte('expense_date', firstDay)
          .lte('expense_date', lastDay),

        supabase
          .from('deposits')
          .select('member_id, amount')
          .eq('mess_id', mess.id)
          .gte('deposit_date', firstDay)
          .lte('deposit_date', lastDay),

        supabase
          .from('meals')
          .select('member_id, breakfast, lunch, dinner')
          .eq('mess_id', mess.id)
          .gte('meal_date', firstDay)
          .lte('meal_date', lastDay),
      ]);

      if (expRes.error)  throw expRes.error;
      if (depRes.error)  throw depRes.error;
      if (mealRes.error) throw mealRes.error;

      const expenses = expRes.data  ?? [];
      const deposits = depRes.data  ?? [];
      const meals    = mealRes.data ?? [];

      // Total expenses this month
      const totalExpenses = expenses.reduce((s, r) => s + parseFloat(r.amount), 0);

      // Per-member: what they paid (as payer)
      const paid = {};
      for (const r of expenses) {
        paid[r.paid_by] = (paid[r.paid_by] ?? 0) + parseFloat(r.amount);
      }

      // Per-member: what they deposited
      const deposited = {};
      for (const r of deposits) {
        deposited[r.member_id] = (deposited[r.member_id] ?? 0) + parseFloat(r.amount);
      }

      // Per-member: meal count (to calculate fair share)
      const mealCount = {};
      let totalMeals = 0;
      for (const r of meals) {
        const c = (r.breakfast ? 1 : 0) + (r.lunch ? 1 : 0) + (r.dinner ? 1 : 0);
        mealCount[r.member_id] = (mealCount[r.member_id] ?? 0) + c;
        totalMeals += c;
      }

      const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;

      // Build balance per member
      const rows = members.map((m) => {
        const myMeals    = mealCount[m.id] ?? 0;
        const myShare    = parseFloat((myMeals * mealRate).toFixed(2));
        const myPaid     = paid[m.id]      ?? 0;
        const myDeposit  = deposited[m.id] ?? 0;

        // balance = what they put in (paid expenses + deposits) - what they owe (their share)
        // positive → they've over-contributed (others owe them)
        // negative → they under-contributed (they owe the mess)
        const balance = parseFloat((myPaid + myDeposit - myShare).toFixed(2));

        return {
          member:     m,
          meals:      myMeals,
          share:      myShare,
          paid:       parseFloat(myPaid.toFixed(2)),
          deposited:  parseFloat(myDeposit.toFixed(2)),
          balance,
        };
      });

      return {
        rows,
        totalExpenses: parseFloat(totalExpenses.toFixed(2)),
        totalMeals,
        mealRate:  parseFloat(mealRate.toFixed(2)),
      };
    },
  });
}

// ── useAddExpense ─────────────────────────────────────────────
export function useAddExpense() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();

  return useMutation({
    mutationFn: async ({ paidBy, description, amount, category, expenseDate }) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          mess_id:      mess.id,
          paid_by:      paidBy,
          description:  description.trim(),
          amount:       parseFloat(amount),
          category,
          expense_date: expenseDate,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const ym = data.expense_date.slice(0, 7);
      _bustAll(qc, mess?.id, ym);
    },
  });
}

// ── useDeleteExpense ──────────────────────────────────────────
export function useDeleteExpense() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, expenseDate }) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('mess_id', mess.id);
      if (error) throw error;
      return expenseDate;
    },
    onSuccess: (expenseDate) => {
      const ym = expenseDate.slice(0, 7);
      _bustAll(qc, mess?.id, ym);
    },
  });
}

// ── useAddDeposit ─────────────────────────────────────────────
export function useAddDeposit() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();

  return useMutation({
    mutationFn: async ({ memberId, amount, note, depositDate }) => {
      const { data, error } = await supabase
        .from('deposits')
        .insert({
          mess_id:      mess.id,
          member_id:    memberId,
          amount:       parseFloat(amount),
          note:         note?.trim() || null,
          deposit_date: depositDate,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const ym = data.deposit_date.slice(0, 7);
      _bustAll(qc, mess?.id, ym);
    },
  });
}

// ── useDeleteDeposit ──────────────────────────────────────────
export function useDeleteDeposit() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();

  return useMutation({
    mutationFn: async ({ id, depositDate }) => {
      const { error } = await supabase
        .from('deposits')
        .delete()
        .eq('id', id)
        .eq('mess_id', mess.id);
      if (error) throw error;
      return depositDate;
    },
    onSuccess: (depositDate) => {
      const ym = depositDate.slice(0, 7);
      _bustAll(qc, mess?.id, ym);
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────
function lastOfMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).toISOString().split('T')[0];
}

function _bustAll(qc, messId, ym) {
  qc.invalidateQueries({ queryKey: EXP_KEYS.list(messId, ym) });
  qc.invalidateQueries({ queryKey: EXP_KEYS.deposits(messId, ym) });
  qc.invalidateQueries({ queryKey: EXP_KEYS.balance(messId, ym) });
  qc.invalidateQueries({ queryKey: ['stats', messId] });
  qc.invalidateQueries({ queryKey: ['recent-expenses', messId] });
  // Also bust meal summary for rate recalculation
  qc.invalidateQueries({ queryKey: ['meals-summary', messId, ym] });
}

export { lastOfMonth };
