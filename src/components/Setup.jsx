// ============================================
// FILE: src/components/Setup.jsx
// ============================================
import React from 'react';
import { Languages, Moon, Sun } from 'lucide-react';

const Setup = ({ darkMode, setDarkMode, language, setLanguage, onCreateMess, t }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const messInfo = {
      id: Date.now(),
      name: formData.get('messName'),
      created_at: new Date().toISOString()
    };
    
    const userInfo = {
      id: Date.now(),
      name: formData.get('userName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      is_manager: true,
      joined_at: new Date().toISOString()
    };
    
    onCreateMess(messInfo, userInfo);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      <div className="flex justify-end p-4 gap-2">
        <button
          onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
          className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}
        >
          <Languages className="w-5 h-5" />
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 w-full max-w-md`}>
          <h1 className={`text-3xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {t.createMess}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.messName}</label>
              <input
                type="text"
                name="messName"
                required
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.yourName}</label>
              <input
                type="text"
                name="userName"
                required
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.email}</label>
              <input
                type="email"
                name="email"
                required
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.phone}</label>
              <input
                type="tel"
                name="phone"
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition"
            >
              {t.create}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Setup;
