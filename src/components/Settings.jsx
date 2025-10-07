// ============================================
// FILE: src/components/Settings.jsx
// ============================================
import React from 'react';
import { LogOut } from 'lucide-react';

const Settings = ({ darkMode, setDarkMode, language, setLanguage, t }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.settings}</h2>
      
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg space-y-6`}>
        <div>
          <h3 className="text-lg font-bold mb-3">{t.theme}</h3>
          <div className="flex gap-4">
            <button
              onClick={() => setDarkMode(false)}
              className={`px-6 py-3 rounded-lg ${!darkMode ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              {t.light}
            </button>
            <button
              onClick={() => setDarkMode(true)}
              className={`px-6 py-3 rounded-lg ${darkMode ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {t.dark}
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-3">{t.language}</h3>
          <div className="flex gap-4">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-6 py-3 rounded-lg ${language === 'bn' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-6 py-3 rounded-lg ${language === 'en' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              English
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-3">{t.notifications}</h3>
          <label className="flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5" defaultChecked />
            <span>Enable push notifications</span>
          </label>
        </div>

        <div className="pt-4 border-t border-gray-300 dark:border-gray-700">
          <button className="flex items-center gap-2 text-red-500 hover:text-red-600">
            <LogOut className="w-5 h-5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Settings;
