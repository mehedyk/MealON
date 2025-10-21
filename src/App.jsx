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
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const t = translations[language];

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Timeout for loading screen
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Show loading state
  if (loading && !loadingTimeout) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className={`text-xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>Loading...</div>
        </div>
      </div>
    );
  }

  // Show error if loading times out
  if (loadingTimeout) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className={`text-center p-8 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-lg max-w-md`}>
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Connection Error
          </h2>
          <p className={`mb-6 ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
            Unable to connect. Please check your internet.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated
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

  // No mess
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
      case 'settings': return <Settings {...props} darkMode={darkMode} setDarkMode={setDarkMode} language={language} setLanguage={setLanguage} />;
      default: return <Dashboard {...props} />;
    }
  };

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
