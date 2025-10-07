// ============================================
// FILE: src/components/Reports.jsx
// ============================================
import React from 'react';

const Reports = ({ darkMode, t, members, meals, expenses }) => {
  const calculateMealStats = () => {
    const currentMonth = new Date().getMonth();
    const monthMeals = meals.filter(m => new Date(m.meal_date).getMonth() === currentMonth);
    const totalMeals = monthMeals.reduce((acc, m) => 
      acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0
    );
    const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
    const mealRate = totalMeals > 0 ? totalExpenseAmount / totalMeals : 0;
    
    return { totalMeals, mealRate, totalExpenseAmount };
  };

  const stats = calculateMealStats();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.reports}</h2>
      
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
          <button className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition">
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
              {members.map(member => {
                const memberMeals = meals
                  .filter(m => m.member_id === member.id)
                  .reduce((acc, m) => acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0);
                const memberExpenses = expenses.filter(e => e.paid_by === member.id).reduce((acc, e) => acc + e.amount, 0);
                const memberShare = stats.mealRate * memberMeals;
                const memberBalance = memberExpenses - memberShare;
                
                return (
                  <tr key={member.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="p-3 font-medium">{member.name}</td>
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
