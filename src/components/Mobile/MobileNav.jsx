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
