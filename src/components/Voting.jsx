// ============================================
// FILE 8: src/components/Voting.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Voting = ({ darkMode, t, mess, member }) => {
  const [members, setMembers] = useState([]);
  const [votes, setVotes] = useState({});
  const [myVote, setMyVote] = useState(null);
  const [loading, setLoading] = useState(false);
  const votingPeriod = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

  useEffect(() => {
    loadData();
    
    const channel = supabase.channel('voting_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `mess_id=eq.${mess.id}` }, loadData)
      .subscribe();

    return () => channel.unsubscribe();
  }, [mess.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, votesRes] = await Promise.all([
        supabase.from('members').select('*').eq('mess_id', mess.id),
        supabase.from('votes').select('*').eq('mess_id', mess.id).eq('voting_period', votingPeriod)
      ]);

      setMembers(membersRes.data || []);
      
      const voteCounts = {};
      votesRes.data?.forEach(vote => {
        voteCounts[vote.candidate_id] = (voteCounts[vote.candidate_id] || 0) + 1;
        if (vote.voter_id === member.id) {
          setMyVote(vote.candidate_id);
        }
      });
      setVotes(voteCounts);
    } catch (error) {
      console.error('Error loading voting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (candidateId) => {
    try {
      const { error } = await supabase
        .from('votes')
        .upsert([{
          mess_id: mess.id,
          voter_id: member.id,
          candidate_id: candidateId,
          voting_period: votingPeriod
        }], { onConflict: 'voter_id,mess_id,voting_period' });

      if (error) throw error;

      setMyVote(candidateId);
      loadData();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t.voting}</h2>
        <button onClick={loadData} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
      
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
        <h3 className="text-xl font-bold mb-2">{t.currentManager}</h3>
        <p className="text-lg">{members.find(m => m.role === 'manager')?.name}</p>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
        <h3 className="text-xl font-bold mb-4">{t.voteForManager}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(memberItem => (
            <button
              key={memberItem.id}
              onClick={() => handleVote(memberItem.id)}
              className={`p-4 rounded-lg border-2 transition ${
                myVote === memberItem.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <p className="font-bold">{memberItem.name}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {votes[memberItem.id] || 0} {t.vote}(s)
              </p>
              {myVote === memberItem.id && (
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
