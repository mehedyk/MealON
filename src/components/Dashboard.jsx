// ============================================
// 1. src/components/Dashboard.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Dashboard = ({ darkMode, t, mess, member }) => {
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mess?.id && member?.id) {
      loadData();
      
      const mealsSubscription = supabase
        .channel('meals_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'meals',
          filter: `mess_id=eq.${mess.id}`
        }, loadData)
        .subscribe();
        
      const expensesSubscription = supabase
        .channel('expenses_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'expenses',
          filter: `mess_id=eq.${mess.id}`
        }, loadData)
        .subscribe();

      return () => {
        mealsSubscription.unsubscribe();
        expensesSubscription.unsubscribe();
      };
    }
  }, [mess?.id, member?.id]);

  const loadData = async () => {
    if (!mess?.id) {
      setError('No mess data');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('📊 Loading dashboard data for mess:', mess.id);

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
      
      console.log('✅ Dashboard data loaded');
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      setError(error.message);
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
      const expenseDate = new Date(e.created_at);
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
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button onClick={loadData} className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  const stats = calculateMealStats();
  const balance = calculateBalance();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.dashboard}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.totalExpenses}</p>
              <p className="text-2xl font-bold mt-1">৳{stats.totalExpenseAmount.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-red-500 opacity-20" />
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.mealsThisMonth}</p>
              <p className="text-2xl font-bold mt-1">{stats.userMeals}</p>
            </div>
            <Calendar className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.mealRate}</p>
              <p className="text-2xl font-bold mt-1">৳{stats.mealRate.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.yourBalance}</p>
              <p className={`text-2xl font-bold mt-1 ${balance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                ৳{Math.abs(balance).toFixed(2)}
              </p>
              <p className="text-xs mt-1">{balance > 0 ? t.youAreOwed : t.youOwe}</p>
            </div>
            <Users className="w-12 h-12 text-purple-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
        <h3 className="text-xl font-bold mb-4">{t.recentActivities}</h3>
        <div className="space-y-3">
          {[...meals.slice(-5), ...expenses.slice(-5)]
            .sort((a, b) => new Date(b.created_at || b.meal_date) - new Date(a.created_at || a.meal_date))
            .slice(0, 10)
            .map((item, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  {item.breakfast !== undefined ? (
                    <Calendar className="w-5 h-5 text-blue-500" />
                  ) : (
                    <DollarSign className="w-5 h-5 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium">
                      {item.breakfast !== undefined 
                        ? `${members.find(m => m.id === item.member_id)?.name || 'Unknown'} - Meal`
                        : item.description
                      }
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(item.created_at || item.meal_date).toLocaleString()}
                    </p>
                  </div>
                </div>
                {item.amount && <span className="font-bold">৳{parseFloat(item.amount).toFixed(2)}</span>}
              </div>
            ))}
          {meals.length === 0 && expenses.length === 0 && (
            <p className="text-center py-8 text-gray-500">No activities yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
