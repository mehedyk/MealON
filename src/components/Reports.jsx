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

  // ============================================
  // Enhanced PDF Export Function
  // ============================================
  const exportComprehensivePDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Helper to check if we need a new page
      const checkPageBreak = (needed = 20) => {
        if (yPos + needed > pageHeight - 20) {
          doc.addPage();
          yPos = 20;
          return true;
        }
        return false;
      };
      
      // ===== HEADER =====
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text(mess.name, pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Monthly Comprehensive Report', pageWidth / 2, 25, { align: 'center' });
      doc.text(`Code: ${mess.mess_code}`, pageWidth / 2, 32, { align: 'center' });
      
      yPos = 50;
      doc.setTextColor(0, 0, 0);
      
      // ===== REPORT INFO =====
      doc.setFontSize(10);
      doc.setFont(undefined, 'italic');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
      doc.text(`Period: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, pageWidth - 14, yPos, { align: 'right' });
      yPos += 10;
      
      // ===== EXECUTIVE SUMMARY =====
      checkPageBreak(40);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('📊 Executive Summary', 14, yPos);
      yPos += 8;
      
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 8;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      const summaryData = [
        ['Total Members', members.length.toString()],
        ['Total Meals Consumed', totalMeals.toString()],
        ['Total Expenses', `৳${totalExpense.toFixed(2)}`],
        ['Average Meal Rate', `৳${mealRate.toFixed(2)}`],
        ['Highest Meal Consumer', memberMealData[0]?.fullName || 'N/A'],
        ['Total Days Active', new Date().getDate().toString()],
        ['Average Daily Expense', `৳${(totalExpense / new Date().getDate()).toFixed(2)}`]
      ];
      
      doc.autoTable({
        startY: yPos,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 11, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 80 },
          1: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // ===== MEMBER DETAILS =====
      checkPageBreak(40);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text('👥 Member Details', 14, yPos);
      yPos += 8;
      
      doc.setDrawColor(16, 185, 129);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 8;
      
      const memberDetailsData = members.map(m => {
        const memberMeals = monthMeals
          .filter(meal => meal.member_id === m.id)
          .reduce((acc, meal) => acc + (meal.breakfast ? 1 : 0) + (meal.lunch ? 1 : 0) + (meal.dinner ? 1 : 0), 0);
        
        const memberExpenses = monthExpenses
          .filter(e => e.paid_by === m.id)
          .reduce((acc, e) => acc + parseFloat(e.amount), 0);
        
        const memberShare = mealRate * memberMeals;
        const balance = memberExpenses - memberShare;
        
        return [
          m.name,
          m.role === 'manager' ? '👑 Manager' : m.role === 'second_in_command' ? '🛡️ 2nd' : 'Member',
          memberMeals.toString(),
          `৳${memberExpenses.toFixed(2)}`,
          `৳${memberShare.toFixed(2)}`,
          `৳${Math.abs(balance).toFixed(2)} ${balance >= 0 ? '(owed)' : '(owes)'}`
        ];
      });
      
      doc.autoTable({
        startY: yPos,
        head: [['Name', 'Role', 'Meals', 'Paid', 'Share', 'Balance']],
        body: memberDetailsData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], fontSize: 10, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 25 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'right', cellWidth: 28 },
          4: { halign: 'right', cellWidth: 28 },
          5: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // ===== MEAL BREAKDOWN =====
      checkPageBreak(40);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(245, 158, 11);
      doc.text('🍽️ Meal Breakdown', 14, yPos);
      yPos += 8;
      
      doc.setDrawColor(245, 158, 11);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 8;
      
      const mealBreakdownData = members.map(m => {
        const memberMeals = monthMeals.filter(meal => meal.member_id === m.id);
        const breakfast = memberMeals.filter(meal => meal.breakfast).length;
        const lunch = memberMeals.filter(meal => meal.lunch).length;
        const dinner = memberMeals.filter(meal => meal.dinner).length;
        const total = breakfast + lunch + dinner;
        
        return [
          m.name,
          breakfast.toString(),
          lunch.toString(),
          dinner.toString(),
          total.toString(),
          `${((total / totalMeals) * 100).toFixed(1)}%`
        ];
      });
      
      doc.autoTable({
        startY: yPos,
        head: [['Member', 'Breakfast', 'Lunch', 'Dinner', 'Total', '% of Total']],
        body: mealBreakdownData,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11], fontSize: 10, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'center', cellWidth: 25 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
          5: { halign: 'right', cellWidth: 30 }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // ===== EXPENSE DETAILS =====
      checkPageBreak(40);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text('💰 Expense Details', 14, yPos);
      yPos += 8;
      
      doc.setDrawColor(239, 68, 68);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 8;
      
      // Category breakdown
      const categoryBreakdown = Object.keys(categoryData).map(key => [
        key.charAt(0).toUpperCase() + key.slice(1),
        `৳${categoryData[key].toFixed(2)}`,
        `${((categoryData[key] / totalExpense) * 100).toFixed(1)}%`
      ]);
      
      doc.autoTable({
        startY: yPos,
        head: [['Category', 'Amount', '% of Total']],
        body: categoryBreakdown,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], fontSize: 10, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { halign: 'right', cellWidth: 50, fontStyle: 'bold' },
          2: { halign: 'right', cellWidth: 50 }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // ===== RECENT EXPENSES =====
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Recent Expenses (Last 10)', 14, yPos);
      yPos += 8;
      
      const recentExpenses = monthExpenses
        .slice(0, 10)
        .map(e => {
          const payer = members.find(m => m.id === e.paid_by);
          return [
            new Date(e.expense_date || e.created_at).toLocaleDateString(),
            e.description.substring(0, 30),
            payer?.name || 'Unknown',
            e.category,
            `৳${parseFloat(e.amount).toFixed(2)}`
          ];
        });
      
      doc.autoTable({
        startY: yPos,
        head: [['Date', 'Description', 'Paid By', 'Category', 'Amount']],
        body: recentExpenses,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68], fontSize: 9, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
        }
      });
      
      yPos = doc.lastAutoTable.finalY + 15;
      
      // ===== INSIGHTS =====
      checkPageBreak(40);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(139, 92, 246);
      doc.text('💡 Key Insights', 14, yPos);
      yPos += 8;
      
      doc.setDrawColor(139, 92, 246);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 10;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const avgMealsPerMember = (totalMeals / members.length).toFixed(1);
      const avgExpensePerMember = (totalExpense / members.length).toFixed(2);
      const topSpender = members.reduce((max, m) => {
        const spent = monthExpenses.filter(e => e.paid_by === m.id).reduce((acc, e) => acc + parseFloat(e.amount), 0);
        return spent > max.amount ? { name: m.name, amount: spent } : max;
      }, { name: '', amount: 0 });
      
      const insights = [
        `• Average meals per member: ${avgMealsPerMember} meals`,
        `• Average expense per member: ৳${avgExpensePerMember}`,
        `• Highest contributor: ${topSpender.name} (৳${topSpender.amount.toFixed(2)})`,
        `• Most expensive day: ${expenseTrendData.reduce((max, d) => d.amount > max.amount ? d : max, { amount: 0, day: 0 }).day || 'N/A'}`,
        `• Daily average expense: ৳${(totalExpense / new Date().getDate()).toFixed(2)}`,
        `• Projected month-end expense: ৳${((totalExpense / new Date().getDate()) * 30).toFixed(2)}`
      ];
      
      insights.forEach(insight => {
        checkPageBreak(10);
        doc.text(insight, 20, yPos);
        yPos += 7;
      });
      
      // ===== FOOTER =====
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${totalPages} | Generated by MealON | ${mess.name}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      
      // Save
      doc.save(`${mess.name}_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      return true;
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Error exporting PDF: ' + error.message);
      return false;
    }
  };

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
          onClick={exportComprehensivePDF}
          className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 rounded-lg transition shadow-lg"
        >
          <Download className="w-5 h-5" />
          Export Comprehensive PDF Report
        </button>
      </div>
    </div>
  );
};

export default Reports;
