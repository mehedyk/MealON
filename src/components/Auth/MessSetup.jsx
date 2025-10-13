// ============================================
// FILE: src/components/Auth/MessSetup.jsx - FIXED
// ============================================
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Moon, Sun, Globe } from 'lucide-react';

const MessSetup = ({ darkMode, setDarkMode, language, setLanguage, t }) => {
  const { user, createMess, joinMess, signOut } = useAuth();
  const [mode, setMode] = useState('create'); // 'create' or 'join'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [messName, setMessName] = useState('');
  const [userName, setUserName] = useState(user?.user_metadata?.name || '');
  const [messCode, setMessCode] = useState('');

  const handleCreateMess = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!messName.trim()) {
      setMessage({ type: 'error', text: t.error + ': Mess name is required' });
      return;
    }

    if (!userName.trim()) {
      setMessage({ type: 'error', text: t.error + ': Your name is required' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    console.log('📝 Form data:', { messName, userName });

    try {
      const { data, error } = await createMess(messName.trim(), userName.trim());
      
      if (error) {
        setMessage({ type: 'error', text: error });
      } else {
        setMessage({ type: 'success', text: t.success + '! Mess created successfully!' });
        console.log('✅ Mess created:', data);
        // Context will handle the redirect automatically
      }
    } catch (err) {
      console.error('Create mess error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to create mess' });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMess = async (e) => {
    e.preventDefault();
    
    if (!messCode.trim() || messCode.length !== 6) {
      setMessage({ type: 'error', text: t.error + ': Valid 6-digit mess code required' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data, error } = await joinMess(messCode);
      
      if (error) {
        setMessage({ type: 'error', text: error });
      } else {
        setMessage({ type: 'success', text: t.joinRequestSent });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to join mess' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Header Controls */}
      <div className="fixed top-4 right-4 flex gap-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-white text-gray-700'} shadow-lg hover:scale-110 transition`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
          className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-700'} shadow-lg hover:scale-110 transition`}
        >
          <Globe size={20} />
        </button>
        <button
          onClick={signOut}
          className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white shadow-lg transition`}
        >
          {t.logout}
        </button>
      </div>

      {/* Main Card */}
      <div className={`w-full max-w-md ${darkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-2xl p-8`}>
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
            🍽️ {t.appName}
          </h1>
          <p className={`${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            {language === 'bn' ? 'মেস সেটআপ করুন' : 'Set up your mess'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              mode === 'create'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.createMess}
          </button>
          <button
            onClick={() => setMode('join')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              mode === 'join'
                ? 'bg-blue-600 text-white'
                : darkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.joinMess}
          </button>
        </div>

        {/* Message Display */}
        {message.text && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Create Mess Form */}
        {mode === 'create' && (
          <form onSubmit={handleCreateMess} className="space-y-4">
            <div>
              <label className={`block mb-2 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {t.yourName} *
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={language === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your name'}
                required
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            <div>
              <label className={`block mb-2 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {t.messName} *
              </label>
              <input
                type="text"
                value={messName}
                onChange={(e) => setMessName(e.target.value)}
                placeholder={language === 'bn' ? 'মেসের নাম লিখুন' : 'Enter mess name'}
                required
                className={`w-full px-4 py-3 rounded-lg border ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.loading : t.create}
            </button>
          </form>
        )}

        {/* Join Mess Form */}
        {mode === 'join' && (
          <form onSubmit={handleJoinMess} className="space-y-4">
            <div>
              <label className={`block mb-2 font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {t.messCode}
              </label>
              <input
                type="text"
                value={messCode}
                onChange={(e) => setMessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                className={`w-full px-4 py-3 rounded-lg border text-center text-2xl tracking-widest ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                {t.messCodeInfo}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t.loading : t.join}
            </button>
          </form>
        )}

        {/* User Info */}
        <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'} text-center`}>
            {language === 'bn' ? 'লগইন হিসেবে' : 'Logged in as'}: <span className="font-semibold">{user?.email}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MessSetup;
