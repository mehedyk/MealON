// ============================================
// FILE: src/components/Header.jsx
// ============================================
import React from 'react';
import { Menu, Moon, Sun, Languages, Bell } from 'lucide-react';

const Header = ({ darkMode, setDarkMode, language, setLanguage, sidebarOpen, setSidebarOpen, messData, currentUser, t }) => {
  return (
    <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md p-4 flex items-center justify-between sticky top-0 z-50`}>
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">{messData?.name || t.appName}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          title={t.language}
        >
          <Languages className="w-5 h-5" />
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          title={t.theme}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <Bell className="w-5 h-5 cursor-pointer" title={t.notifications} />
        <div className={`px-3 py-1 rounded-full text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          {currentUser?.name}
        </div>
      </div>
    </header>
  );
};

export default Header;
