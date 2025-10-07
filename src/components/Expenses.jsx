// ============================================
// FILE: src/components/Expenses.jsx
// ============================================
import React from 'react';

const Expenses = ({ darkMode, t, expenses, setExpenses, members }) => {
  const handleAddExpense = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newExpense = {
      id: Date.now(),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      category: formData.get('category'),
      paid_by: parseInt(formData.get('paidBy')),
      created_at: new Date().toISOString()
    };
    setExpenses([...expenses, newExpense]);
    e.target.reset();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.expenses}</h2>
      
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
              <label className={`block mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t.paidBy}</label>
              <select
                name="paidBy"
                required
                className={`w-full p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              >
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>
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
              {expenses.slice().reverse().map(expense => {
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
                        {expense.category === 'groceries' ? t.groceries : expense.category === 'utilities' ? t.utilities : t.misc}
                      </span>
                    </td>
                    <td className="p-3 font-bold">৳{expense.amount.toFixed(2)}</td>
                    <td className="p-3">{payer?.name}</td>
                    <td className="p-3 text-sm">{new Date(expense.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
