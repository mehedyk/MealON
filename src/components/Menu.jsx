// ============================================
// FILE: src/components/Menu.jsx
// ============================================
import React from 'react';

const Menu = ({ darkMode, t, menuItems, setMenuItems }) => {
  const handleAddMenuItem = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newItem = {
      id: Date.now(),
      dish: formData.get('dishName'),
      meal_type: formData.get('mealType'),
      menu_date: formData.get('menuDate'),
      created_at: new Date().toISOString()
    };
    setMenuItems([...menuItems, newItem]);
    e.target.reset();
  };

  const today = new Date().toISOString().split('T')[0];

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
          <button type="submit" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
            {t.add}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['breakfast', 'lunch', 'dinner'].map(mealType => (
          <div key={mealType} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <h3 className="text-lg font-bold mb-4 capitalize">
              {mealType === 'breakfast' ? t.breakfast : mealType === 'lunch' ? t.lunch : t.dinner}
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
