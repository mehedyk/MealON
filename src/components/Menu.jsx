/ ============================================
// 4. src/components/Menu.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Menu = ({ darkMode, t, mess, member }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadMenuItems();
  }, [mess.id]);

  const loadMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('mess_id', mess.id)
        .gte('menu_date', today)
        .order('menu_date', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const formData = new FormData(e.target);

    try {
      const { error } = await supabase
        .from('menu_items')
        .insert([{
          mess_id: mess.id,
          dish: formData.get('dishName'),
          meal_type: formData.get('mealType'),
          menu_date: formData.get('menuDate')
        }]);

      if (error) throw error;

      setMessage(t.success + '!');
      e.target.reset();
      loadMenuItems();
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  if (loading) return <div className="text-center py-12">{t.loading}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.todaysMenu}</h2>
      
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
