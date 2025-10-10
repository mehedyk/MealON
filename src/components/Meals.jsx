// ============================================
// FILE: src/components/Meals.jsx - WITH SUPABASE
// ============================================
import React, { useState, useEffect } from 'react';
import { Bell, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Meals = ({ darkMode, t, mess, member }) => {
  const [meals, setMeals] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [mess.id]);

  const loadData = async () => {
    try {
      const [mealsRes, membersRes] = await Promise.all([
        supabase.from('meals').select('*').eq('mess_id', mess.id).order('meal_date', { ascending: false }),
        supabase.from('members').select('*').eq('mess_id', mess.id)
      ]);

      setMeals(mealsRes.data || []);
      setMembers(membersRes.data || []);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const formData = new FormData(e.target);
    const mealDate = formData.get('mealDate');
    const breakfast = formData.get('breakfast') === 'on';
    const lunch = formData.get('lunch') === 'on';
    const dinner = formData.get('dinner') === 'on';

    try {
      const { error } = await supabase
        .from('meals')
        .upsert([{
          mess_id: mess.id,
          member_id: member.id,
          meal_date: mealDate,
          breakfast,
          lunch,
          dinner
        }], { onConflict: 'member_id,meal_date' });

      if (error) throw error;

      setMessage(t.success + '!');
      e.target.reset();
      loadData();
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  if (loading) return <div className="text-center py-12">{t.loading}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.meals}</h2>
      
      <div className={`${darkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border-2 rounded-xl p-4 mb-6`}>
        <p className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <span className="font-medium">{t.mealNotice}</span>
        </p>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
        <h3 className="text-xl font-bold mb-4">{t.logMeal}</h3>
        <form onSubmit={handleLogMeal} className="space-y-4">
          <div>
            <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.date}</label>
            <input
              type="date"
              name="mealDate"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
              className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <label className={`flex items-center gap-2 p-4 rounded-lg border-2 cursor-pointer ${darkMode ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-500'}`}>
              <input type="checkbox" name="breakfast" className="w-5 h-5" />
              <span>{t.breakfast}</span>
            </label>
            <label className={`flex items-center gap-2 p-4 rounded-lg border-2 cursor-pointer ${darkMode ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-500'}`}>
              <input type="checkbox" name="lunch" className="w-5 h-5" />
              <span>{t.lunch}</span>
            </label>
            <label className={`flex items-center gap-2 p-4 rounded-lg border-2 cursor-pointer ${darkMode ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-500'}`}>
              <input type="checkbox" name="dinner" className="w-5 h-5" />
              <span>{t.dinner}</span>
            </label>
          </div>
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
          <button type="submit" className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition">
            {t.save}
          </button>
        </form>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
        <h3 className="text-xl font-bold mb-4">{t.mealLogs}</h3>
        <div className="space-y-3">
          {meals.map(meal => {
            const mealMember = members.find(m => m.id === meal.member_id);
            return (
              <div key={meal.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{mealMember?.name || 'Unknown'}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(meal.meal_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {meal.breakfast && <span className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-full">{t.breakfast}</span>}
                    {meal.lunch && <span className="px-3 py-1 bg-orange-500 text-white text-sm rounded-full">{t.lunch}</span>}
                    {meal.dinner && <span className="px-3 py-1 bg-purple-500 text-white text-sm rounded-full">{t.dinner}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Meals;
