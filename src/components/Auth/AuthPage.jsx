// ============================================
// FILE: src/components/Auth/AuthPage.jsx
// Complete Authentication Page with Login, Signup, Reset Password
// ============================================
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Phone, Languages, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Funny messages in both languages
const funnyMessages = {
  en: [
    "No wife? No problem! Mess food is the solution! 🍛",
    "Even with a wife, mess food hits different! 😄",
    "Bachelor's paradise - where bills are shared! 💰",
    "Cooking? What's that? We have mess! 🤷‍♂️",
    "From instant noodles to real meals - upgrade your life! 🍜",
    "Your stomach called - it wants mess food! 📞",
    "Home away from home, but with better food! 🏠",
    "Mess life = Best life! No cap! 🎯",
    "Split bills, not friendships! 💪",
    "Where strangers become family over biryani! 🍚",
    "Tired of cooking? Join the club! 🍳",
    "Mess: Where food appears magically! ✨",
    "No dishes to wash? That's the dream! 🧼",
    "Living the mess life, one meal at a time! 🥘",
    "Community dining, individual happiness! 😊",
    "Forget takeout, embrace mess-out! 📦",
    "Shared kitchen, shared memories! 🏡",
    "Mess meals: Budget-friendly, taste-approved! ✅",
    "Why cook alone when you can feast together? 🍽️",
    "Student life essentials: Books, bed, and mess! 📚"
  ],
  bn: [
    "বউ নাই? সমস্যা নাই! মেস আছে! 🍛",
    "বউ থাকতেও মেস-এ খাওয়া লাগে! 😄",
    "ব্যাচেলরদের স্বর্গ - যেখানে খরচ ভাগ হয়! 💰",
    "রান্না? সেটা আবার কী? মেস আছে তো! 🤷‍♂️",
    "নুডলস থেকে পরিপূর্ণ খাবার - জীবন আপগ্রেড করুন! 🍜",
    "আপনার পেট ডাকছে - মেসের খাবার চাই! 📞",
    "ঘর থেকে দূরে ঘর, কিন্তু খাবার আরও ভাল! 🏠",
    "মেস লাইফ = বেস্ট লাইফ! একদম সত্যি! 🎯",
    "বিল ভাগ করুন, বন্ধুত্ব না! 💪",
    "যেখানে অচেনারা বিরিয়ানিতে পরিবার হয়! 🍚",
    "রান্নায় ক্লান্ত? মেসে যোগ দিন! 🍳",
    "মেস: যেখানে খাবার যাদুর মতো আসে! ✨",
    "থালা-বাসন ধোয়া নেই? স্বপ্ন সত্যি! 🧼",
    "মেস লাইফ লিভিং, এক খাবারে এক স্বাদ! 🥘",
    "সবাই মিলে খাওয়া, একা একা খুশি! 😊",
    "টেকআউট ভুলে যান, মেস আপনার! 📦",
    "শেয়ারড রান্নাঘর, শেয়ারড স্মৃতি! 🏡",
    "মেসের খাবার: বাজেট ফ্রেন্ডলি, টেস্ট অ্যাপ্রুভড! ✅",
    "একা কেন রাঁধবেন যখন সবাই মিলে খেতে পারেন? 🍽️",
    "স্টুডেন্ট লাইফের জরুরি: বই, বিছানা আর মেস! 📚"
  ]
};

const AuthPage = ({ darkMode, setDarkMode, language, setLanguage, t }) => {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, resetPassword, error } = useAuth();
  
  // State for forms
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    phone: '',
    country_code: '+880',
    password: '',
    confirmPassword: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Random funny message
  const randomMessage = funnyMessages[language][Math.floor(Math.random() * funnyMessages[language].length)];

  // Country codes with phone length validation
  const countryCodes = [
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩', length: 10 },
    { code: '+91', country: 'India', flag: '🇮🇳', length: 10 },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰', length: 10 },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸', length: 10 },
    { code: '+44', country: 'UK', flag: '🇬🇧', length: 10 },
    { code: '+61', country: 'Australia', flag: '🇦🇺', length: 9 },
    { code: '+971', country: 'UAE', flag: '🇦🇪', length: 9 },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', length: 9 },
  ];

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      setMessage(error);
    }
    setLoading(false);
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      setMessage(t.passwordMismatch || 'Passwords do not match!');
      return;
    }

    // Validate phone length
    const selectedCountry = countryCodes.find(c => c.code === signupData.country_code);
    if (signupData.phone && signupData.phone.length !== selectedCountry?.length) {
      setMessage(`Phone number must be ${selectedCountry?.length} digits for ${selectedCountry?.country}`);
      return;
    }

    setLoading(true);
    const { error } = await signUp(signupData.email, signupData.password, {
      name: signupData.name,
      phone: signupData.phone,
      country_code: signupData.country_code
    });

    if (error) {
      setMessage(error);
    } else {
      setMessage(t.checkEmail || 'Check your email for verification link!');
      setTimeout(() => setMode('login'), 3000);
    }
    setLoading(false);
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error } = await resetPassword(forgotEmail);
    
    if (error) {
      setMessage(error);
    } else {
      setMessage('Password reset link sent to your email!');
      setTimeout(() => setMode('login'), 3000);
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
          title={t.language}
        >
          <Languages className="w-5 h-5" />
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white hover:bg-gray-100'} shadow-md transition`}
          title={t.theme}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className={`w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Header with Logo */}
        <div className={`p-8 text-center ${darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
          <h1 className="text-4xl font-bold text-white mb-2">MealON</h1>
          <p className="text-blue-100 text-sm">
            {language === 'bn' ? 'মেস ম্যানেজমেন্ট সহজ করা হলো' : 'Mess Management Made Easy'}
          </p>
        </div>

        {/* Funny Message */}
        <div className={`mx-8 mt-6 p-4 rounded-lg text-center ${darkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'}`}>
          <p className="text-sm">{randomMessage}</p>
        </div>

        {/* Forms Container */}
        <div className="p-8">
          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {t.login}
              </h2>

              <div>
                <label className={`block mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    required
                    className={`w-full pl-10 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.password || 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                    className={`w-full pl-10 pr-10 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.loading : t.login}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                >
                  {t.forgotPassword || 'Forgot Password?'}
                </button>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t.noAccount || "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                  >
                    {t.signUp || 'Sign Up'}
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {t.signUp}
              </h2>

              <div>
                <label className={`block mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.yourName}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={signupData.name}
                    onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                    required
                    className={`w-full pl-10 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                    required
                    className={`w-full pl-10 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className={`block mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.phone} ({language === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
                </label>
                <div className="flex gap-2">
                  <select
                    value={signupData.country_code}
                    onChange={(e) => setSignupData({...signupData, country_code: e.target.value})}
                    className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                  >
                    {countryCodes.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={signupData.phone}
                      onChange={(e) => setSignupData({...signupData, phone: e.target.value.replace(/\D/g, '')})}
                      pattern="[0-9]*"
                      maxLength={countryCodes.find(c => c.code === signupData.country_code)?.length}
                      className={`w-full pl-10 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                      placeholder={`${countryCodes.find(c => c.code === signupData.country_code)?.length} digits`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.password || 'Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signupData.password}
                    onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                    required
                    minLength="6"
                    className={`w-full pl-10 pr-10 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.confirmPassword || 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                    required
                    className={`w-full pl-10 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50"
              >
                {loading ? t.loading : t.signUp}
              </button>

              <p className={`text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {t.haveAccount || 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                >
                  {t.login}
                </button>
              </p>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {t.resetPassword || 'Reset Password'}
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                {language === 'bn' 
                  ? 'আপনার ইমেইল লিখুন, আমরা পাসওয়ার্ড রিসেট লিঙ্ক পাঠাব'
                  : 'Enter your email and we\'ll send you a password reset link'}
              </p>

              <div>
                <label className={`block mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className={`w-full pl-10 p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 outline-none`}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition disabled:opacity-50"
              >
                {loading ? t.loading : (t.resetPassword || 'Send Reset Link')}
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className={`w-full text-center text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
              >
                {t.cancel || 'Back to Login'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
