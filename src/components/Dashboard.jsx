// FILE 3: src/components/Dashboard.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Dashboard = ({ darkMode, t, mess, member }) => {
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mess?.id && member?.id) {
      loadData();
      
      const channel = supabase.channel('dashboard_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meals', filter: `mess_id=eq.${mess.id}` }, loadData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `mess_id=eq.${mess.id}` }, loadData)
        .subscribe();

      return () => channel.unsubscribe();
    }
  }, [mess?.id, member?.id]);

  const loadData = async () => {
    if (!mess?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [membersRes, mealsRes, expensesRes] = await Promise.all([
        supabase.from('members').select('*').eq('mess_id', mess.id),
        supabase.from('meals').select('*').eq('mess_id', mess.id),
        supabase.from('expenses').select('*').eq('mess_id', mess.id)
      ]);

      if (membersRes.error) throw membersRes.error;
      if (mealsRes.error) throw mealsRes.error;
      if (expensesRes.error) throw expensesRes.error;

      setMembers(membersRes.data || []);
      setMeals(mealsRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateMealStats = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthMeals = meals.filter(m => {
      const mealDate = new Date(m.meal_date);
      return mealDate.getMonth() === currentMonth && mealDate.getFullYear() === currentYear;
    });
    
    const totalMeals = monthMeals.reduce((acc, m) => 
      acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0
    );
    
    const userMeals = monthMeals
      .filter(m => m.member_id === member.id)
      .reduce((acc, m) => acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0);
    
    const monthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.expense_date || e.created_at);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const totalExpenseAmount = monthExpenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
    const mealRate = totalMeals > 0 ? totalExpenseAmount / totalMeals : 0;
    
    return { totalMeals, userMeals, mealRate, totalExpenseAmount };
  };

  const calculateBalance = () => {
    const stats = calculateMealStats();
    const userExpenses = expenses
      .filter(e => e.paid_by === member.id)
      .reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
    const userShare = stats.mealRate * stats.userMeals;
    return userExpenses - userShare;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>{t.loading}</p>
      </div>
      
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
        <h3 className="text-xl font-bold mb-4">{t.addMenuItem}</h3>
        <form onSubmit={handleAddMenuItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="dishName"
              placeholder={t.dishName}
              required
              className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
            <select
              name="mealType"
              required
              className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            >
              <option value="breakfast">{t.breakfast}</option>
              <option value="lunch">{t.lunch}</option>
              <option value="dinner">{t.dinner}</option>
            </select>
            <input
              type="date"
              name="menuDate"
              defaultValue={today}
              required
              className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
          </div>
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
          <button type="submit" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
            {t.add}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['breakfast', 'lunch', 'dinner'].map(mealType => (
          <div key={mealType} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className="text-lg font-bold mb-4 capitalize">
              {t[mealType]}
            </h3>
            <div className="space-y-2">
              {menuItems
                .filter(item => item.meal_type === mealType && item.menu_date === today)
                .map(item => (
                  <div key={item.id} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className="font-medium">{item.dish}</p>
                  </div>
                ))}
              {menuItems.filter(item => item.meal_type === mealType && item.menu_date === today).length === 0 && (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No items added</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
