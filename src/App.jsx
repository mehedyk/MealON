// ============================================
// FILE: src/App.jsx - WITH LOADING TIMEOUT
// ============================================
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { translations } from './translations';

import DebugPanel from './components/DebugPanel';
// Auth Components
import AuthPage from './components/Auth/AuthPage';
import MessSetup from './components/Auth/MessSetup';


// Main Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import Contact from './components/Contact';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Show loading state with timeout
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
            Unable to connect to the server. Please check your internet connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth page
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

  // Authenticated but no mess - show mess setup
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

  // Full app with mess
  const renderPage = () => {
    const props = {
      darkMode,
      language,
      t,
      mess,
      member
    };

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...props} />;
      case 'members':
        return <Members {...props} />;
      case 'meals':
        return <Meals {...props} />;
      case 'expenses':
        return <Expenses {...props} />;
      case 'menu':
        return <Menu {...props} />;
      case 'rules':
        return <Rules {...props} />;
      case 'voting':
        return <Voting {...props} />;
      case 'reports':
        return <Reports {...props} />;
      case 'contact':
        return <Contact {...props} />;
      case 'settings':
        return <Settings {...props} darkMode={darkMode} setDarkMode={setDarkMode} language={language} setLanguage={setLanguage} />;
      default:
        return <Dashboard {...props} />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-gray-800'}`}>
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={setLanguage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        mess={mess}
        member={member}
        t={t}
      />
      
      <div className="flex">
        <Sidebar
          darkMode={darkMode}
          sidebarOpen={sidebarOpen}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          t={t}
        />
        
        <main className="flex-1 p-6 pb-20">
          {renderPage()}
        </main>
      </div>

      <Footer darkMode={darkMode} t={t} />
    </div>
  );
};

export default App;
