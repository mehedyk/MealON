// ============================================
// FILE: src/App.jsx - COMPLETE VERSION
// ============================================
import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { translations } from './translations';

// Auth Components
import AuthPage from './components/Auth/AuthPage';
import MessSetup from './components/Auth/MessSetup';

// Main Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
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

  const t = translations[language];

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
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
      case 'settings':
        return <Settings {...props} darkMode={darkMode} setDarkMode={setDarkMode} language={language} setLanguage={setLanguage} />;
      default:
        return <Dashboard {...props} />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
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
