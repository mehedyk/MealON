// ============================================================
// src/hooks/useDashboard.js
// Fetches summary stats for the dashboard.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function useDashboardStats() {
  const { mess } = useAuthStore();
  const messId = mess?.id;

  return useQuery({
    queryKey: ['dashboard-stats', messId],
    enabled: !!messId,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const today = new Date();
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const todayStr   = today.toISOString().split('T')[0];

      const [membersRes, mealsRes, expensesRes, depositsRes] = await Promise.all([
        supabase
          .from('members')
          .select('id, name, role, joined_at', { count: 'exact' })
          .eq('mess_id', messId)
          .eq('is_active', true),

        supabase
          .from('meals')
          .select('breakfast, lunch, dinner, meal_date')
          .eq('mess_id', messId)
          .gte('meal_date', monthStart),

        supabase
          .from('expenses')
          .select('amount, expense_date')
          .eq('mess_id', messId)
          .gte('expense_date', monthStart),

        supabase
          .from('deposits')
          .select('amount')
          .eq('mess_id', messId)
          .gte('deposit_date', monthStart),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (mealsRes.error)   throw mealsRes.error;

      const members  = membersRes.data || [];
      const meals    = mealsRes.data   || [];
      const expenses = expensesRes.data || [];
      const deposits = depositsRes.data || [];

      // Total meals this month (each meal record can have 3 slots)
      const totalMeals = meals.reduce((acc, m) => {
        return acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0);
      }, 0);

      // Today's meals
      const todayMeals = meals.filter((m) => m.meal_date === todayStr);
      const todayMealCount = todayMeals.reduce((acc, m) => {
        return acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0);
      }, 0);

      // Total expenses this month
      const totalExpenses = expenses.reduce((acc, e) => acc + parseFloat(e.amount), 0);

      // Total deposits this month
      const totalDeposits = deposits.reduce((acc, d) => acc + parseFloat(d.amount), 0);

      // Meal rate = total expenses / total meals (avoid /0)
      const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;

      // Recent expenses (last 5)
      const { data: recentExpenses } = await supabase
        .from('expenses')
        .select('id, description, amount, category, expense_date, paid_by(name)')
        .eq('mess_id', messId)
        .order('expense_date', { ascending: false })
        .limit(5);

      return {
        memberCount:    members.length,
        totalMeals,
        todayMealCount,
        totalExpenses,
        totalDeposits,
        mealRate,
        recentExpenses: recentExpenses || [],
        monthLabel: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      };
    },
  });
}
