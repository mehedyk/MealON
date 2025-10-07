import React from 'react';

export default function Settings({ darkMode, setDarkMode, language, setLanguage, t }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.settings}</h2>
      <div className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-xl">
        <div>
          <label className="block mb-2">{t.theme}</label>
          <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 bg-blue-500 text-white rounded">{darkMode ? t.dark : t.light}</button>
        </div>
        <div>
          <label className="block mb-2">{t.language}</label>
          <select value={language} onChange={(e)=>setLanguage(e.target.value)} className="p-2 border rounded">
            <option value="bn">বাংলা</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  );
}
