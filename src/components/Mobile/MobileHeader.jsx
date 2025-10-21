// ============================================
// FILE 1: src/components/Mobile/MobileHeader.jsx
// ============================================
import React, { useState } from 'react';
import { Moon, Sun, Languages, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileHeader = ({ darkMode, setDarkMode, language, setLanguage, mess, member, t }) => {
  const { signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    if (window.confirm(t.confirm + ' ' + t.logout + '?')) {
      await signOut();
    }
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b shadow-lg`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Logo & Mess Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl">🍽️</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">{mess?.name || 'MealON'}</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                {member?.name}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
            <div className="p-4 space-y-2">
              {/* User Info */}
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white font-bold text-lg`}>
                    {member?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{member?.name}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                      {member?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    member?.role === 'manager' 
                      ? 'bg-yellow-500 text-white' 
                      : member?.role === 'second_in_command'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}>
                    {member?.role === 'manager' ? '👑 Manager' : member?.role === 'second_in_command' ? '🛡️ 2nd' : 'Member'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                    {mess?.mess_code}
                  </span>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => {
                  setDarkMode(!darkMode);
                  setShowMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{darkMode ? t.light : t.dark} Mode</span>
              </button>

              {/* Language Toggle */}
              <button
                onClick={() => {
                  setLanguage(language === 'bn' ? 'en' : 'bn');
                  setShowMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <Languages className="w-5 h-5" />
                <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
              >
                <LogOut className="w-5 h-5" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Overlay */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMenu(false)}
          style={{ top: '65px' }}
        />
      )}
    </>
  );
};

export default MobileHeader;


// ============================================
// FILE 2: src/components/Mobile/MobileNav.jsx
// ============================================
import React from 'react';
import { 
  Home, Users, Calendar, DollarSign, BookOpen, 
  ClipboardList, Vote, FileText, MessageSquare, Settings 
} from 'lucide-react';

const MobileNav = ({ darkMode, currentPage, setCurrentPage, t }) => {
  // Primary navigation items (shown in bottom bar)
  const primaryItems = [
    { id: 'dashboard', icon: Home, label: t.dashboard },
    { id: 'members', icon: Users, label: t.members },
    { id: 'meals', icon: Calendar, label: t.meals },
    { id: 'expenses', icon: DollarSign, label: t.expenses },
    { id: 'reports', icon: FileText, label: t.reports }
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t shadow-2xl`}>
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {primaryItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                isActive
                  ? darkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : darkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={{
                transform: isActive ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'animate-bounce-subtle' : ''}`} />
              <span className="text-xs font-medium truncate max-w-full">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary nav - swipe up to reveal */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-50'} px-4 py-2 overflow-x-auto`}>
        <div className="flex gap-2 min-w-max">
          {[
            { id: 'menu', icon: BookOpen, label: t.menu },
            { id: 'rules', icon: ClipboardList, label: t.rules },
            { id: 'voting', icon: Vote, label: t.voting },
            { id: 'contact', icon: MessageSquare, label: t.contact || 'Contact' },
            { id: 'settings', icon: Settings, label: t.settings }
          ].map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </nav>
  );
};

export default MobileNav;
