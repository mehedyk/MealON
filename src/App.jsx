// ============================================
// App.jsx
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

  // DEBUG: Log state changes
  useEffect(() => {
    console.log('🔍 APP STATE:', {
      loading,
      hasUser: !!user,
      hasMember: !!member,
      hasMess: !!mess,
      timestamp: new Date().toISOString()
    });
  }, [loading, user, member, mess]);

  // CRITICAL: Simple loading check with timeout fallback
  if (loading) {
    // Auto-clear loading after 3 seconds (emergency fallback)
    setTimeout(() => {
      if (loading) {
        console.error('⚠️ Loading stuck! Force reloading...');
        window.location.reload();
      }
    }, 3000);

    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className={`text-xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {t.loading || 'Loading...'}
          </div>
          <div className="mt-4 text-sm opacity-50">
            {loading ? 'Loading true' : 'Loading false'} | User: {user ? 'Yes' : 'No'}
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    console.log('📝 Showing AuthPage');
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

  // No mess
  if (!mess || !member) {
    console.log('🏠 Showing MessSetup');
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
      case 'settings': return <Settings {...props} darkMode={darkMode} setDarkMode={setDarkMode} language={language} setLanguage={setLanguage} />;
      default: return <Dashboard {...props} />;
    }
  };

  console.log('✅ Rendering main app');

  // Mobile-first layout
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
