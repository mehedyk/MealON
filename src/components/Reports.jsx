// ============================================
// 7. src/components/Reports.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const Reports = ({ darkMode, t, mess, member }) => {
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChart, setSelectedChart] = useState('overview');

  useEffect(() => {
    loadData();
  }, [mess.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, mealsRes, expensesRes] = await Promise.all([
        supabase.from('members').select('*').eq('mess_id', mess.id),
        supabase.from('meals').select('*').eq('mess_id', mess.id),
        supabase.from('expenses').select('*').eq('mess_id', mess.id)
      ]);

      setMembers(membersRes.data || []);
      setMeals(mealsRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthMeals = meals.filter(m => {
    const date = new Date(m.meal_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalMeals = monthMeals.reduce((acc, m) => 
    acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0
  );

  const monthExpenses = expenses.filter(e => {
    const date = new Date(e.expense_date || e.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalExpense = monthExpenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
  const mealRate = totalMeals > 0 ? totalExpense / totalMeals : 0;

  // Chart 1: Member-wise meal consumption (Bar Chart)
  const memberMealData = members.map(m => {
    const memberMeals = monthMeals
      .filter(meal => meal.member_id === m.id)
      .reduce((acc, meal) => acc + (meal.breakfast ? 1 : 0) + (meal.lunch ? 1 : 0) + (meal.dinner ? 1 : 0), 0);
    
    return {
      name: m.name.split(' ')[0],
      meals: memberMeals,
      fullName: m.name
    };
  }).sort((a, b) => b.meals - a.meals);

  // Chart 2: Expense by category (Pie Chart)
  const categoryData = monthExpenses.reduce((acc, e) => {
    const cat = e.category || 'misc';
    acc[cat] = (acc[cat] || 0) + parseFloat(e.amount);
    return acc;
  }, {});

  const expenseByCategory = Object.keys(categoryData).map(key => ({
    name: t[key] || key,
    value: categoryData[key]
  }));

  // Chart 3: Daily expense trend (Line Chart)
  const dailyExpenses = monthExpenses.reduce((acc, e) => {
    const date = new Date(e.expense_date || e.created_at).getDate();
    acc[date] = (acc[date] || 0) + parseFloat(e.amount);
    return acc;
  }, {});

  const expenseTrendData = Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    amount: dailyExpenses[i + 1] || 0
  })).filter(d => d.amount > 0);

  // Chart 4: Member balance (Bar Chart)
  const memberBalanceData = members.map(m => {
    const memberMeals = monthMeals
      .filter(meal => meal.member_id === m.id)
      .reduce((acc, meal) => acc + (meal.breakfast ? 1 : 0) + (meal.lunch ? 1 : 0) + (meal.dinner ? 1 : 0), 0);
    
    const memberExpenses = monthExpenses
      .filter(e => e.paid_by === m.id)
      .reduce((acc, e) => acc + parseFloat(e.amount), 0);
    
    const share = mealRate * memberMeals;
    const balance = memberExpenses - share;
    
    return {
      name: m.name.split(' ')[0],
      paid: memberExpenses,
      share: share,
      balance: balance,
      fullName: m.name
    };
  });

  // Chart 5: Meal type distribution (Pie Chart)
  const mealTypeData = [
    { name: t.breakfast, value: monthMeals.filter(m => m.breakfast).length },
    { name: t.lunch, value: monthMeals.filter(m => m.lunch).length },
    { name: t.dinner, value: monthMeals.filter(m => m.dinner).length }
  ];

  // Chart 6: Weekly expense (Area Chart)
  const weeklyData = monthExpenses.reduce((acc, e) => {
    const week = Math.floor(new Date(e.expense_date || e.created_at).getDate() / 7);
    acc[week] = (acc[week] || 0) + parseFloat(e.amount);
    return acc;
  }, {});

  const weeklyExpenseData = Object.keys(weeklyData).map(week => ({
    week: `Week ${parseInt(week) + 1}`,
    amount: weeklyData[week]
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-3 rounded-lg shadow-lg border`}>
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ৳{typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">{t.reports}</h2>
        <button 
          onClick={loadData} 
          className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-blue-500 to-blue-700'} rounded-xl p-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">{members.length}</p>
          <p className="text-sm opacity-90">{t.totalMembers}</p>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-800' : 'bg-gradient-to-br from-green-500 to-green-700'} rounded-xl p-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">{totalMeals}</p>
          <p className="text-sm opacity-90">{t.total} {t.meals}</p>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-gradient-to-br from-red-500 to-red-700'} rounded-xl p-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">৳{totalExpense.toFixed(0)}</p>
          <p className="text-sm opacity-90">{t.totalExpenses}</p>
        </div>

        <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-800' : 'bg-gradient-to-br from-purple-500 to-purple-700'} rounded-xl p-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold">৳{mealRate.toFixed(2)}</p>
          <p className="text-sm opacity-90">{t.mealRate}</p>
        </div>
      </div>

      {/* Chart Selection */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['overview', 'meals', 'expenses', 'balance', 'trends'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedChart(type)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
              selectedChart === type
                ? 'bg-blue-600 text-white'
                : darkMode 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      {selectedChart === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Member Meal Consumption */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className="text-xl font-bold mb-4">Member Meal Consumption</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberMealData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="meals" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Expense by Category */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className="text-xl font-bold mb-4">Expense by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedChart === 'meals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meal Type Distribution */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className="text-xl font-bold mb-4">Meal Type Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mealTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {mealTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Member Meal Bar */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className="text-xl font-bold mb-4">Top Meal Consumers</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberMealData.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis type="number" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <YAxis dataKey="name" type="category" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="meals" fill="#10B981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedChart === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Expense Trend */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className="text-xl font-bold mb-4">Daily Expense Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={expenseTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="day" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="amount" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Expense */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className="text-xl font-bold mb-4">Weekly Expense</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="week" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedChart === 'balance' && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
          <h3 className="text-xl font-bold mb-4">Member Balance Overview</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={memberBalanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="name" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
              <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="paid" fill="#10B981" name="Paid" radius={[8, 8, 0, 0]} />
              <Bar dataKey="share" fill="#F59E0B" name="Share" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedChart === 'trends' && (
        <div className="grid grid-cols-1 gap-6">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className="text-xl font-bold mb-4">Expense Trends (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={expenseTrendData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="day" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#3B82F6" fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            import('jspdf').then(({ jsPDF }) => {
              const doc = new jsPDF();
              doc.text(`${mess.name} - Monthly Report`, 14, 15);
              doc.text(`Total Members: ${members.length}`, 14, 25);
              doc.text(`Total Meals: ${totalMeals}`, 14, 35);
              doc.text(`Total Expenses: ৳${totalExpense.toFixed(2)}`, 14, 45);
              doc.text(`Meal Rate: ৳${mealRate.toFixed(2)}`, 14, 55);
              doc.save(`${mess.name}_Report.pdf`);
            });
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg transition shadow-lg"
        >
          <Download className="w-5 h-5" />
          Export PDF Report
        </button>
      </div>
    </div>
  );
};

export default Reports;
