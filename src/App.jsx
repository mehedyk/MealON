// ===========================================
// src/App.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { translations } from './translations';

// Auth Components
import AuthPage from './components/Auth/AuthPage';
import MessSetup from './components/Auth/MessSetup';

// Layout Components
import MobileHeader from './components/Mobile/MobileHeader';
import MobileNav from './components/Mobile/MobileNav';
import Footer from './components/Footer';

// Page Components
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Meals from './components/Meals';
import Expenses from './components/Expenses';
import Menu from './components/Menu';
import Rules from './components/Rules';
import Voting from './components/Voting';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Contact from './components/Contact';

const App = () => {
  const { user, member, mess, loading } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'bn';
  });
  
  const [currentPage, setCurrentPage] = useState('dashboard');

  const t = translations[language];

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Show loading screen with timeout and refresh button
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="text-center max-w-md px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className={`text-xl mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {t.loading || 'Loading...'}
          </div>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            If this takes too long, try refreshing
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                // Clear cache and reload
                localStorage.clear();
                window.location.reload();
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Clear Cache & Refresh
            </button>
            <button
              onClick={() => window.location.reload()}
              className={`px-6 py-2 rounded-lg transition ${
                darkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Just Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!user) {
    return (
      <AuthPage 
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
    );
  }

  // Authenticated but no mess - show setup
  if (!mess || !member) {
    return (
      <MessSetup
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />
    );
  }

  // Render current page
  const renderPage = () => {
    const props = { darkMode, language, t, mess, member };
    
    switch (currentPage) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'members': return <Members {...props} />;
      case 'meals': return <Meals {...props} />;
      case 'expenses': return <Expenses {...props} />;
      case 'menu': return <Menu {...props} />;
      case 'rules': return <Rules {...props} />;
      case 'voting': return <Voting {...props} />;
      case 'reports': return <Reports {...props} />;
      case 'contact': return <Contact {...props} />;
      case 'settings': 
        return <Settings 
          {...props} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          language={language} 
          setLanguage={setLanguage} 
        />;
      default: return <Dashboard {...props} />;
    }
  };

  // Main app interface
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-gray-800'}`}>
      {/* Mobile Header */}
      <MobileHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={setLanguage}
        mess={mess}
        member={member}
        t={t}
      />
      
      {/* Main Content */}
      <main className="pb-24 px-4 pt-20 max-w-7xl mx-auto">
        <div className="animate-fadeIn">
          {renderPage()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        darkMode={darkMode}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        t={t}
      />

      {/* Footer - Hidden on Mobile */}
      <div className="hidden md:block">
        <Footer darkMode={darkMode} t={t} />
      </div>
    </div>
  );
};

export default App;
