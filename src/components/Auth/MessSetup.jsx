// ============================================
// FILE: src/components/Auth/MessSetup.jsx
// Create New Mess or Join Existing Mess
// ============================================
import React, { useState } from 'react';
import { Home, Users, Key, Languages, Moon, Sun, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MessSetup = ({ darkMode, setDarkMode, language, setLanguage, t }) => {
  const [mode, setMode] = useState('choose'); // 'choose', 'create', 'join'
  const [messName, setMessName] = useState('');
  const [messCode, setMessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { createMess, joinMess } = useAuth();

  // Handle Create Mess
  const handleCreateMess = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await createMess(messName);

    if (error) {
      setMessage(error);
    } else {
      setMessage(`${t.success}! ${t.messCode}: ${data.mess_code}`);
      // Context will auto-reload and show main app
    }
    setLoading(false);
  };

  // Handle Join Mess
  const handleJoinMess = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await joinMess(messCode);

    if (error) {
      setMessage(error);
    } else {
      setMessage(t.joinRequestSent);
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} flex items-center justify-center p-4`}>
      {/* Theme & Language Switcher */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
          className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-md transition`}
        >
          <Languages className="w-5 h-5" />
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-md transition`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className={`w-full max-w-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className={`p-8 text-center ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
          <h1 className="text-4xl font-bold text-white mb-2">MealON</h1>
          <p className="text-blue-100">
            {language === 'bn' ? 'আপনার মেস সেটআপ করুন' : 'Setup Your Mess'}
          </p>
        </div>

        <div className="p-8">
          {/* CHOOSE MODE */}
          {mode === 'choose' && (
            <div className="space-y-6">
              <h2 className={`text-2xl font-bold text-center mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {language === 'bn' ? 'কীভাবে শুরু করবেন?' : 'How would you like to start?'}
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Create Mess Card */}
                <button
                  onClick={() => setMode('create')}
                  className={`p-8 rounded-xl border-2 transition-all hover:scale-105 ${
                    darkMode 
                      ? 'bg-gray-700 border-blue-500 hover:border-blue-400' 
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 hover:border-blue-500'
                  }`}
                >
                  <Home className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t.createMess}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'bn' 
                      ? 'নতুন মেস তৈরি করুন এবং ম্যানেজার হন'
                      : 'Start a new mess and become the manager'}
                  </p>
                  <ArrowRight className={`w-6 h-6 mx-auto mt-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </button>

                {/* Join Mess Card */}
                <button
                  onClick={() => setMode('join')}
                  className={`p-8 rounded-xl border-2 transition-all hover:scale-105 ${
                    darkMode 
                      ? 'bg-gray-700 border-green-500 hover:border-green-400' 
                      : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:border-green-500'
                  }`}
                >
                  <Users className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {t.joinMess}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'bn' 
                      ? 'মেস কোড দিয়ে বিদ্যমান মেসে যোগ দিন'
                      : 'Join an existing mess using a code'}
                  </p>
                  <ArrowRight className={`w-6 h-6 mx-auto mt-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                </button>
              </div>
            </div>
          )}

          {/* CREATE MESS FORM */}
          {mode === 'create' && (
            <form onSubmit={handleCreateMess} className="space-y-6">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline mb-4`}
              >
                ← {t.cancel || 'Back'}
              </button>

              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {t.createMess}
              </h2>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'}`}>
                <p className="text-sm">
                  {language === 'bn' 
                    ? '✨ আপনি ম্যানেজার হবেন এবং একটি অনন্য ৬-সংখ্যার কোড পাবেন যা সদস্যরা যোগদানের জন্য ব্যবহার করবে।'
                    : '✨ You will be the manager and receive a unique 6-digit code that members can use to join.'}
                </p>
              </div>

              <div>
                <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.messName}
                </label>
                <input
                  type="text"
                  value={messName}
                  onChange={(e) => setMessName(e.target.value)}
                  required
                  placeholder={language === 'bn' ? 'যেমন: সূর্য মেস' : 'e.g., Sunrise Mess'}
                  className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes('Error') || message.includes('error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50"
              >
                {loading ? t.loading : `${t.create} ${t.messName}`}
              </button>
            </form>
          )}

          {/* JOIN MESS FORM */}
          {mode === 'join' && (
            <form onSubmit={handleJoinMess} className="space-y-6">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline mb-4`}
              >
                ← {t.cancel || 'Back'}
              </button>

              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {t.joinMess}
              </h2>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-50 text-green-800'}`}>
                <p className="text-sm">
                  {language === 'bn' 
                    ? '🔑 আপনার মেস ম্যানেজারের কাছ থেকে ৬-সংখ্যার কোড পান এবং এটি এখানে লিখুন।'
                    : '🔑 Get the 6-digit code from your mess manager and enter it here.'}
                </p>
              </div>

              <div>
                <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.messCode}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={messCode}
                    onChange={(e) => setMessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    pattern="[0-9]{6}"
                    maxLength="6"
                    placeholder="123456"
                    className={`w-full pl-10 p-3 rounded-lg border text-2xl tracking-widest text-center ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-green-500 outline-none`}
                  />
                </div>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t.messCodeInfo || 'Enter 6-digit mess code'}
                </p>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes('Error') || message.includes('error') || message.includes('Invalid') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || messCode.length !== 6}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition disabled:opacity-50"
              >
                {loading ? t.loading : t.join}
              </button>

              <p className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'bn' 
                  ? 'অনুরোধ পাঠানোর পর ম্যানেজারের অনুমোদনের জন্য অপেক্ষা করুন।'
                  : 'After sending request, wait for manager approval.'}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessSetup;
