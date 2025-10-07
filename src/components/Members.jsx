// ============================================
// FILE: src/components/Members.jsx
// ============================================
import React from 'react';

const Members = ({ darkMode, t, members, setMembers }) => {
  const handleAddMember = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newMember = {
      id: Date.now(),
      name: formData.get('memberName'),
      email: formData.get('memberEmail'),
      phone: formData.get('memberPhone'),
      is_manager: false,
      joined_at: new Date().toISOString()
    };
    setMembers([...members, newMember]);
    e.target.reset();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.members}</h2>
      
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
        <h3 className="text-xl font-bold mb-4">{t.addMember}</h3>
        <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            name="memberName"
            placeholder={t.memberName}
            required
            className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
          />
          <input
            type="email"
            name="memberEmail"
            placeholder={t.email}
            className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
          />
          <input
            type="tel"
            name="memberPhone"
            placeholder={t.phone}
            className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
          />
          <button type="submit" className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition">
            {t.add}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <div key={member.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">{member.name}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{member.email}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{member.phone}</p>
                {member.is_manager && (
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                    {t.messManager}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Members;
