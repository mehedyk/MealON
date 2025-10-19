// ============================================
// 7. src/components/Reports.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Reports = ({ darkMode, t, mess, member }) => {
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

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
      console.error('Error loading data:', error);
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
    
    const monthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.expense_date || e.created_at);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const totalExpenseAmount = monthExpenses.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
    const mealRate = totalMeals > 0 ? totalExpenseAmount / totalMeals : 0;
    
    return { totalMeals, mealRate, totalExpenseAmount };
  };

  const stats = calculateMealStats();

  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text(mess.name, pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Monthly Report', pageWidth / 2, 22, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Summary', 14, 40);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Total Members: ${members.length}`, 14, 48);
      doc.text(`Total Meals: ${stats.totalMeals}`, 14, 54);
      doc.text(`Total Expenses: ৳${stats.totalExpenseAmount.toFixed(2)}`, 14, 60);
      doc.text(`Meal Rate: ৳${stats.mealRate.toFixed(2)}`, 14, 66);
      
      const tableData = members.map(memberItem => {
        const memberMeals = meals
          .filter(m => m.member_id === memberItem.id)
          .reduce((acc, m) => acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0);
        const memberExpenses = expenses
          .filter(e => e.paid_by === memberItem.id)
          .reduce((acc, e) => acc + parseFloat(e.amount), 0);
        const memberShare = stats.mealRate * memberMeals;
        const memberBalance = memberExpenses - memberShare;
        
        return [
          memberItem.name,
          memberMeals.toString(),
          `৳${memberExpenses.toFixed(2)}`,
          `৳${memberShare.toFixed(2)}`,
          `৳${Math.abs(memberBalance).toFixed(2)} ${memberBalance >= 0 ? '(owed)' : '(owes)'}`
        ];
      });
      
      doc.autoTable({
        startY: 75,
        head: [['Member', 'Meals', 'Paid', 'Share', 'Balance']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, font: 'helvetica' },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 }
      });
      
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`Mess Code: ${mess.mess_code}`, 14, finalY);
      
      doc.save(`${mess.name}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Error exporting PDF');
    }
  };

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t.reports}</h2>
        <button onClick={loadData} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
        <h3 className="text-xl font-bold mb-4">{t.monthlyReport}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.totalMembers}</p>
              <p className="text-2xl font-bold">{members.length}</p>
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.total} {t.meals}</p>
              <p className="text-2xl font-bold">{stats.totalMeals}</p>
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.totalExpenses}</p>
              <p className="text-2xl font-bold">৳{stats.totalExpenseAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.mealRate}</p>
              <p className="text-2xl font-bold">৳{stats.mealRate.toFixed(2)}</p>
            </div>
          </div>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition"
          >
            <Download className="w-5 h-5" />
            {t.export} PDF
          </button>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
        <h3 className="text-xl font-bold mb-4">Member-wise Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <th className="p-3 text-left">Member</th>
                <th className="p-3 text-left">Meals</th>
                <th className="p-3 text-left">Expenses Paid</th>
                <th className="p-3 text-left">Share</th>
                <th className="p-3 text-left">Balance</th>
              </tr>
            </thead>
            <tbody>
              {members.map(memberItem => {
                const memberMeals = meals
                  .filter(m => m.member_id === memberItem.id)
                  .reduce((acc, m) => acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0);
                const memberExpenses = expenses.filter(e => e.paid_by === memberItem.id).reduce((acc, e) => acc + parseFloat(e.amount), 0);
                const memberShare = stats.mealRate * memberMeals;
                const memberBalance = memberExpenses - memberShare;
                
                return (
                  <tr key={memberItem.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="p-3 font-medium">{memberItem.name}</td>
                    <td className="p-3">{memberMeals}</td>
                    <td className="p-3">৳{memberExpenses.toFixed(2)}</td>
                    <td className="p-3">৳{memberShare.toFixed(2)}</td>
                    <td className={`p-3 font-bold ${memberBalance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ৳{Math.abs(memberBalance).toFixed(2)}
                      <span className="text-xs ml-1">
                        {memberBalance > 0 ? '(owed)' : '(owes)'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
