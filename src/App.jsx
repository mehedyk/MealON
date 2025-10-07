// ============================================
// FILE: src/App.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { translations } from './translations';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Meals from './components/Meals';
import Expenses from './components/Expenses';
import Menu from './components/Menu';
import Rules from './components/Rules';
import Voting from './components/Voting';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Setup from './components/Setup';

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'bn';
  });
  
  const [currentPage, setCurrentPage] = useState('setup');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messData, setMessData] = useState(null);
  const [members, setMembers] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [rules, setRules] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [votes, setVotes] = useState({});

  const t = translations[language];

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const handleCreateMess = (messInfo, userInfo) => {
    setMessData(messInfo);
    setCurrentUser(userInfo);
    setMembers([userInfo]);
    setCurrentPage('dashboard');
  };

  if (currentPage === 'setup') {
    return (
      <Setup
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={setLanguage}
        onCreateMess={handleCreateMess}
        t={t}
      />
    );
  }

  const renderPage = () => {
    const props = {
      darkMode,
      language,
      t,
      messData,
      members,
      setMembers,
      meals,
      setMeals,
      expenses,
      setExpenses,
      menuItems,
      setMenuItems,
      rules,
      setRules,
      votes,
      setVotes,
      currentUser
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
        return <Settings darkMode={darkMode} setDarkMode={setDarkMode} language={language} setLanguage={setLanguage} t={t} />;
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
        messData={messData}
        currentUser={currentUser}
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
        
        <main className="flex-1 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
