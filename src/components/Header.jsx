// ============================================
// Enhanced Header - Shows user, logout always visible
// ============================================
import React, { useState } from 'react';
import { Menu, Moon, Sun, Languages, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ darkMode, setDarkMode, language, setLanguage, sidebarOpen, setSidebarOpen, mess, member, t }) => {
  const { signOut, user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (window.confirm(t.confirm + ' ' + t.logout + '?')) {
      setLoggingOut(true);
      await signOut();
    }
  };

  return (
    <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-md p-4 flex items-center justify-between sticky top-0 z-50 transition-all duration-200`}>
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className={`lg:hidden p-2 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 transition ${darkMode ? 'text-white' : 'text-gray-800'}`}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {mess?.name || t.appName}
            </h1>
            {mess && (
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {t.messCode}: <span className="font-mono font-bold">{mess.mess_code}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
          title={t.language}
        >
          <Languages className="w-5 h-5" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition`}
          title={t.theme}
        >
          {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>

        {/* Notifications */}
        <button 
          className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition relative`}
          title={t.notifications}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white font-bold`}>
              {member?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {member?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {member?.role === 'manager' ? t.messManager : member?.role === 'second_in_command' ? t.secondInCommand : t.member}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden z-50`}>
              <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {member?.name || 'User'}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {user?.email}
                </p>
                {member && (
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      member.role === 'manager' 
                        ? 'bg-yellow-500 text-white' 
                        : member.role === 'second_in_command'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {member.role === 'manager' ? t.messManager : member.role === 'second_in_command' ? t.secondInCommand : t.member}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-2">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'} transition disabled:opacity-50`}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">
                    {loggingOut ? t.loading : t.logout}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={`md:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-red-50 text-red-600'} transition disabled:opacity-50`}
          title={t.logout}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
