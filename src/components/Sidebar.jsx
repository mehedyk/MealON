import React from 'react';
import { TrendingUp, Users, Calendar, DollarSign, BookOpen, ClipboardList, Vote, FileText, Settings } from 'lucide-react';

export default function Sidebar({ darkMode, sidebarOpen, currentPage, setCurrentPage, t }) {
  const items = [
    { id: 'dashboard', icon: TrendingUp, label: t.dashboard },
    { id: 'members', icon: Users, label: t.members },
    { id: 'meals', icon: Calendar, label: t.meals },
    { id: 'expenses', icon: DollarSign, label: t.expenses },
    { id: 'menu', icon: BookOpen, label: t.menu },
    { id: 'rules', icon: ClipboardList, label: t.rules },
    { id: 'voting', icon: Vote, label: t.voting },
    { id: 'reports', icon: FileText, label: t.reports },
    { id: 'settings', icon: Settings, label: t.settings }
  ];
  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} ${darkMode ? 'bg-gray-800' : 'bg-white'} h-screen sticky top-0 overflow-hidden transition-all duration-300 shadow-lg`}>
      <nav className="p-4 space-y-2">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => setCurrentPage(item.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${currentPage === item.id ? 'bg-blue-500 text-white' : darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
