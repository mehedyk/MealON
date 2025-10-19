// ============================================
// 3. src/components/Expenses.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Expenses = ({ darkMode, t, mess, member }) => {
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
    
    const channel = supabase.channel('expenses_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `mess_id=eq.${mess.id}` }, loadData)
      .subscribe();

    return () => channel.unsubscribe();
  }, [mess.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [expensesRes, membersRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('mess_id', mess.id).order('expense_date', { ascending: false }),
        supabase.from('members').select('*').eq('mess_id', mess.id)
      ]);

      setExpenses(expensesRes.data || []);
      setMembers(membersRes.data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setMessage('');
    
    const formData = new FormData(e.target);

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          mess_id: mess.id,
          paid_by: parseInt(formData.get('paidBy')),
          description: formData.get('description'),
          amount: parseFloat(formData.get('amount')),
          category: formData.get('category'),
          expense_date: formData.get('expenseDate') || new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;

      setMessage(t.success + '!');
      e.target.reset();
      loadData();
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t.expenses}</h2>
        <button onClick={loadData} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
        <h3 className="text-xl font-bold mb-4">{t.addExpense}</h3>
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.description}</label>
              <input
                type="text"
                name="description"
                required
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.amount}</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.category}</label>
              <select
                name="category"
                required
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              >
                <option value="groceries">{t.groceries}</option>
                <option value="utilities">{t.utilities}</option>
                <option value="misc">{t.misc}</option>
              </select>
            </div>
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.date}</label>
              <input
                type="date"
                name="expenseDate"
                defaultValue={new Date().toISOString().split('T')[0]}
                required
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
            </div>
            <div className="md:col-span-2">
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.paidBy}</label>
              <select
                name="paidBy"
                defaultValue={member.id}
                required
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
          <button type="submit" className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition">
            {t.add}
          </button>
        </form>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
        <h3 className="text-xl font-bold mb-4">{t.expenseLogs}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <th className="p-3 text-left">{t.description}</th>
                <th className="p-3 text-left">{t.category}</th>
                <th className="p-3 text-left">{t.amount}</th>
                <th className="p-3 text-left">{t.paidBy}</th>
                <th className="p-3 text-left">{t.date}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => {
                const payer = members.find(m => m.id === expense.paid_by);
                return (
                  <tr key={expense.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="p-3">{expense.description}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        expense.category === 'groceries' ? 'bg-green-100 text-green-800' :
                        expense.category === 'utilities' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {t[expense.category] || expense.category}
                      </span>
                    </td>
                    <td className="p-3 font-bold">৳{parseFloat(expense.amount).toFixed(2)}</td>
                    <td className="p-3">{payer?.name}</td>
                    <td className="p-3 text-sm">{new Date(expense.expense_date || expense.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {expenses.length === 0 && <p className="text-center py-8 text-gray-500">No expenses yet</p>}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
