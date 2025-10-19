// ============================================
// FIXED Members Component - Proper Role Permissions
// ============================================
import React, { useState, useEffect } from 'react';
import { Mail, UserPlus, Check, X, Crown, Shield, RefreshCw, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Members = ({ darkMode, t, mess, member }) => {
  const [members, setMembers] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Only manager and second_in_command can manage
  const isManager = member.role === 'manager';
  const isSecondInCommand = member.role === 'second_in_command';
  const canManage = isManager || isSecondInCommand;

  useEffect(() => {
    loadData();
    
    const channel = supabase.channel('members_channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'members', 
        filter: `mess_id=eq.${mess.id}` 
      }, loadData)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'invitations', 
        filter: `mess_id=eq.${mess.id}` 
      }, loadData)
      .subscribe();

    return () => channel.unsubscribe();
  }, [mess.id]);

  const loadData = async () => {
    try {
      const [membersRes, requestsRes] = await Promise.all([
        supabase
          .from('members')
          .select('*')
          .eq('mess_id', mess.id)
          .order('created_at'),
        canManage 
          ? supabase
              .from('invitations')
              .select('*')
              .eq('mess_id', mess.id)
              .eq('invitation_type', 'join_request')
              .eq('status', 'pending')
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] })
      ]);

      setMembers(membersRes.data || []);
      setJoinRequests(requestsRes.data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.from('invitations').insert([{
        mess_id: mess.id,
        inviter_id: member.id,
        invitee_email: inviteEmail.trim().toLowerCase(),
        invitee_name: inviteName.trim(),
        invitation_type: 'email_invite',
        status: 'pending',
        auto_approve: true
      }]);

      if (error) throw error;

      setMessage('✅ Invited! They will be auto-added when they sign up.');
      setInviteEmail('');
      setInviteName('');
    } catch (error) {
      setMessage('Error: ' + (error.code === '23505' ? 'Already invited!' : error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (invitation) => {
    try {
      setMessage('');
      const { data, error } = await supabase.rpc('approve_member_request', {
        p_invitation_id: invitation.id,
        p_approver_id: member.id
      });

      if (error) throw error;

      if (data.success) {
        setMessage('✅ ' + data.message);
        loadData();
      } else {
        setMessage('⚠️ ' + data.message);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await supabase.from('invitations').update({ status: 'rejected' }).eq('id', id);
      setMessage('Rejected.');
      loadData();
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    // CRITICAL: Only manager can change roles
    if (!isManager) {
      setMessage('❌ Only the mess manager can change roles!');
      return;
    }
    
    try {
      await supabase.from('members').update({ role: newRole }).eq('id', memberId);
      setMessage('✅ Role updated!');
      loadData();
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{t.members}</h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {members.length} {members.length === 1 ? 'member' : 'members'} • 
            {canManage ? ' Manager view' : ' Member view'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData} 
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
            <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              Code: <span className="font-bold text-lg font-mono">{mess.mess_code}</span>
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('Error') || message.includes('❌') || message.includes('⚠️')
            ? 'bg-red-100 text-red-700 border border-red-300'
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {message}
        </div>
      )}

      {canManage && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Members
          </h3>
          <p className="text-sm mb-4 text-gray-500">
            ✨ No approval needed - they're auto-added when they sign up!
          </p>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Name"
                required
                className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email"
                required
                className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? 'Sending...' : 'Invite'}
              </button>
            </div>
          </form>
        </div>
      )}

      {canManage && joinRequests.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
          <h3 className="text-xl font-bold mb-4">Join Requests (Need Approval)</h3>
          <div className="space-y-3">
            {joinRequests.map(req => (
              <div
                key={req.id}
                className={`p-4 rounded-lg flex items-center justify-between ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <div>
                  <p className="font-bold">{req.invitee_name}</p>
                  <p className="text-sm text-gray-500">{req.invitee_email}</p>
                  <p className="text-xs mt-1 text-gray-400">
                    Requested: {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(req)}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    title="Approve"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    title="Reject"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(m => (
          <div
            key={m.id}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                  m.role === 'manager' ? 'bg-yellow-500' :
                  m.role === 'second_in_command' ? 'bg-blue-500' : 
                  'bg-gray-500'
                }`}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{m.name}</h3>
                    {m.role === 'manager' && <Crown className="w-5 h-5 text-yellow-500" title="Manager" />}
                    {m.role === 'second_in_command' && <Shield className="w-5 h-5 text-blue-500" title="Second-in-Command" />}
                    {m.id === member.id && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">You</span>}
                  </div>
                  <p className="text-sm text-gray-500">{m.email}</p>
                  {m.phone && (
                    <p className="text-sm text-gray-500">
                      {m.country_code} {m.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <span className={`inline-block px-3 py-1 text-xs rounded-full ${
              m.role === 'manager'
                ? 'bg-yellow-500 text-white'
                : m.role === 'second_in_command'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-500 text-white'
            }`}>
              {m.role === 'manager' ? 'Manager' : m.role === 'second_in_command' ? '2nd-in-Command' : 'Member'}
            </span>

            {/* Role Change - ONLY FOR MANAGER */}
            {isManager && m.id !== member.id && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <label className="block text-xs mb-2 text-gray-400 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Change Role (Manager Only)
                </label>
                <select
                  value={m.role}
                  onChange={(e) => handleChangeRole(m.id, e.target.value)}
                  className={`w-full p-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                >
                  <option value="member">Member</option>
                  <option value="second_in_command">Second-in-Command</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
            )}

            {/* Show Lock for Non-Managers */}
            {!isManager && m.id !== member.id && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <p className="text-xs text-gray-500 flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Only manager can change roles
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl`}>
          <p className="text-lg text-gray-500">
            No members yet. Invite someone to get started!
          </p>
        </div>
      )}
    </div>
  );
};

export default Members;
