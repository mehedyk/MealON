// ============================================
// FILE: src/components/Dashboard.jsx
// ============================================
import React from 'react';
import { DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';

const Dashboard = ({ darkMode, t, members, meals, expenses, currentUser }) => {
  const calculateMealStats = () => {
    const currentMonth = new Date().getMonth();
    const monthMeals = meals.filter(m => new Date(m.meal_date).getMonth() === currentMonth);
    const totalMeals = monthMeals.reduce((acc, m) => 
      acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0
    );
    const userMeals = monthMeals
      .filter(m => m.member_id === currentUser?.id)
      .reduce((acc, m) => acc + (m.breakfast ? 1 : 0) + (m.lunch ? 1 : 0) + (m.dinner ? 1 : 0), 0);
    
    const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
    const mealRate = totalMeals > 0 ? totalExpenseAmount / totalMeals : 0;
    
    return { totalMeals, userMeals, mealRate, totalExpenseAmount };
  };

  const calculateBalance = () => {
    const stats = calculateMealStats();
    const userExpenses = expenses.filter(e => e.paid_by === currentUser?.id).reduce((acc, e) => acc + e.amount, 0);
    const userShare = stats.mealRate * stats.userMeals;
    return userExpenses - userShare;
  };

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
                {item.amount && <span className="font-bold">৳{item.amount}</span>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
