// ============================================
// FILE 7: src/components/Rules.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Rules = ({ darkMode, t, mess, member }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const isManager = member.role === 'manager' || member.role === 'second_in_command';

  useEffect(() => {
    loadRules();
    
    const channel = supabase.channel('rules_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rules', filter: `mess_id=eq.${mess.id}` }, loadRules)
      .subscribe();

    return () => channel.unsubscribe();
  }, [mess.id]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .eq('mess_id', mess.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const formData = new FormData(e.target);

    try {
      const { error } = await supabase
        .from('rules')
        .insert([{
          mess_id: mess.id,
          title: formData.get('ruleTitle'),
          description: formData.get('ruleDescription'),
          is_active: true
        }]);

      if (error) throw error;

      setMessage(t.success + '!');
      e.target.reset();
      loadRules();
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t.rules}</h2>
        <button onClick={loadRules} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      {isManager && (
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
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message}
              </div>
            )}
            <button type="submit" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition">
              {t.add}
            </button>
          </form>
        </div>
      )}

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
        {rules.length === 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
            <p className="text-gray-500">No rules added yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rules;
