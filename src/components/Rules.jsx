/ ============================================
// FILE: src/components/Rules.jsx
// ============================================
import React from 'react';

const Rules = ({ darkMode, t, rules, setRules }) => {
  const handleAddRule = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newRule = {
      id: Date.now(),
      title: formData.get('ruleTitle'),
      description: formData.get('ruleDescription'),
      created_at: new Date().toISOString()
    };
    setRules([...rules, newRule]);
    e.target.reset();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.rules}</h2>
      
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
        <h3 className="text-xl font-bold mb-4">{t.addRule}</h3>
        <form onSubmit={handleAddRule} className="space-y-4">
          <input
            type="text"
            name="ruleTitle"
            placeholder={t.ruleTitle}
            required
            className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
          />
          <textarea
            name="ruleDescription"
            placeholder={t.ruleDescription}
            rows="3"
            required
            className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
          ></textarea>
          <button type="submit" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
            {t.add}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {rules.map((rule, idx) => (
          <div key={rule.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">
                  {idx + 1}. {rule.title}
                </h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{rule.description}</p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {new Date(rule.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rules;
