// ============================================
// Enhanced Animated Sidebar
// ============================================
import React, { useEffect } from 'react';
import { 
  TrendingUp, Users, Calendar, DollarSign, BookOpen, 
  ClipboardList, Vote, FileText, Settings, MessageSquare,
  X, ChevronRight
} from 'lucide-react';

const Sidebar = ({ darkMode, sidebarOpen, setSidebarOpen, currentPage, setCurrentPage, t }) => {
  const items = [
    { id: 'dashboard', icon: TrendingUp, label: t.dashboard, color: 'blue' },
    { id: 'members', icon: Users, label: t.members, color: 'purple' },
    { id: 'meals', icon: Calendar, label: t.meals, color: 'green' },
    { id: 'expenses', icon: DollarSign, label: t.expenses, color: 'red' },
    { id: 'menu', icon: BookOpen, label: t.menu, color: 'yellow' },
    { id: 'rules', icon: ClipboardList, label: t.rules, color: 'indigo' },
    { id: 'voting', icon: Vote, label: t.voting, color: 'pink' },
    { id: 'reports', icon: FileText, label: t.reports, color: 'orange' },
    { id: 'contact', icon: MessageSquare, label: t.contact || 'Contact', color: 'teal' },
    { id: 'settings', icon: Settings, label: t.settings, color: 'gray' }
  ];

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        const sidebar = document.getElementById('mobile-sidebar');
        if (sidebar && !sidebar.contains(e.target) && !e.target.closest('button[aria-label="Toggle sidebar"]')) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, setSidebarOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  const handleItemClick = (id) => {
    setCurrentPage(id);
    // Auto-close on mobile
    if (window.innerWidth < 1024) {
      setTimeout(() => setSidebarOpen(false), 300);
    }
  };

  const getColorClasses = (color, isActive) => {
    const colors = {
      blue: isActive ? 'bg-blue-500 text-white' : 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30',
      purple: isActive ? 'bg-purple-500 text-white' : 'hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/30',
      green: isActive ? 'bg-green-500 text-white' : 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30',
      red: isActive ? 'bg-red-500 text-white' : 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30',
      yellow: isActive ? 'bg-yellow-500 text-white' : 'hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/30',
      indigo: isActive ? 'bg-indigo-500 text-white' : 'hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30',
      pink: isActive ? 'bg-pink-500 text-white' : 'hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-pink-900/30',
      orange: isActive ? 'bg-orange-500 text-white' : 'hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/30',
      teal: isActive ? 'bg-teal-500 text-white' : 'hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-900/30',
      gray: isActive ? 'bg-gray-500 text-white' : 'hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50
          ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}
          border-r shadow-2xl lg:shadow-lg
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarOpen ? 'w-72' : 'w-0 lg:w-20'}
          overflow-hidden
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className={`flex items-center gap-3 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'}`}>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">🍽️</span>
              </div>
              <div>
                <h2 className="font-bold text-lg">MealON</h2>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mess Manager</p>
              </div>
            </div>
            
            {/* Close button (mobile only) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className={`lg:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
            {items.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl
                    transition-all duration-200 transform
                    ${getColorClasses(item.color, isActive)}
                    ${isActive ? 'scale-105 shadow-lg' : 'hover:scale-102'}
                    group relative overflow-hidden
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: sidebarOpen ? 'slideIn 0.3s ease-out forwards' : 'none'
                  }}
                >
                  {/* Animated background effect */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}
                  
                  {/* Icon with animation */}
                  <div className={`relative ${isActive ? 'animate-bounce-subtle' : ''}`}>
                    <Icon className={`w-5 h-5 ${sidebarOpen ? '' : 'lg:w-6 lg:h-6'} transition-all duration-200`} />
                    {isActive && (
                      <div className="absolute inset-0 blur-md opacity-50">
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`
                    font-medium transition-all duration-300
                    ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 lg:hidden'}
                  `}>
                    {item.label}
                  </span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <ChevronRight className={`
                      ml-auto w-4 h-4 animate-pulse
                      ${sidebarOpen ? 'opacity-100' : 'opacity-0'}
                    `} />
                  )}

                  {/* Tooltip for collapsed state on desktop */}
                  {!sidebarOpen && (
                    <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer (visible when expanded) */}
          <div className={`
            p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}
            transition-opacity duration-300
            ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-0'}
          `}>
            <div className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <p className="font-semibold mb-1">MealON v1.0</p>
              <p>© {new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile floating toggle button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className={`
            lg:hidden fixed bottom-6 left-6 z-30
            w-14 h-14 rounded-full shadow-2xl
            bg-gradient-to-br from-blue-500 to-purple-600
            flex items-center justify-center
            animate-bounce-slow
            hover:scale-110 transition-transform
          `}
        >
          <TrendingUp className="w-6 h-6 text-white" />
        </button>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#374151' : '#E5E7EB'};
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#4B5563' : '#D1D5DB'};
        }
      `}</style>
    </>
  );
};

export default Sidebar;
