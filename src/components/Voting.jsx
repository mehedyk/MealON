// ============================================
// FILE: src/components/Voting.jsx
// ============================================
import React from 'react';
import { Check } from 'lucide-react';

const Voting = ({ darkMode, t, members, votes, setVotes, currentUser }) => {
  const handleVote = (memberId) => {
    setVotes({ ...votes, [currentUser.id]: memberId });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{t.voting}</h2>
      
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
        <h3 className="text-xl font-bold mb-2">{t.currentManager}</h3>
        <p className="text-lg">{members.find(m => m.is_manager)?.name}</p>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
        <h3 className="text-xl font-bold mb-4">{t.voteForManager}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <button
              key={member.id}
              onClick={() => handleVote(member.id)}
              className={`p-4 rounded-lg border-2 transition ${
                votes[currentUser?.id] === member.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <p className="font-bold">{member.name}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {Object.values(votes).filter(v => v === member.id).length} {t.vote}(s)
              </p>
              {votes[currentUser?.id] === member.id && (
                <Check className="w-5 h-5 text-blue-500 mt-2 mx-auto" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Voting;
