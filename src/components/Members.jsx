// ============================================
// FILE: src/components/Members.jsx
// ============================================
import React, { useState, useEffect } from 'react';
import { Mail, UserPlus, Check, X, Crown, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Members = ({ darkMode, t, mess, member }) => {
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isManager = member.role === 'manager' || member.role === 'second_in_command';

  useEffect(() => {
    loadMembers();
    loadInvitations();
  }, [mess.id]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('mess_id', mess.id)
        .order('created_at');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadInvitations = async () => {
    if (!isManager) return;
    
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('mess_id', mess.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  // Send Email Invitation
  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('invitations')
        .insert([{
          mess_id: mess.id,
          inviter_id: member.id,
          invitee_email: inviteEmail,
          invitee_name: inviteName,
          invitation_type: 'email_invite',
          status: 'pending'
        }]);

      if (error) throw error;

      setMessage(t.success + '! ' + (t.sendInvitation || 'Invitation sent!'));
      setInviteEmail('');
      setInviteName('');
      loadInvitations();
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Approve Join Request
  const handleApproveRequest = async (invitation) => {
    try {
      // Check if user exists in auth.users
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', invitation.invitee_email)
        .single();

      if (userError) {
        alert('User has not signed up yet. Please ask them to create an account first.');
        return;
      }

      // Create member entry
      const { error: memberError } = await supabase
        .from('members')
        .insert([{
          user_id: userData.id,
          mess_id: mess.id,
          name: invitation.invitee_name || invitation.invitee_email.split('@')[0],
          email: invitation.invitee_email,
          role: 'member'
        }]);

      if (memberError) throw memberError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      loadMembers();
      loadInvitations();
      setMessage(t.success + '! Member approved.');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Reject Join Request
  const handleRejectRequest = async (invitationId) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;
      loadInvitations();
      setMessage('Request rejected.');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // Change Member Role
  const handleChangeRole = async (memberId, newRole) => {
    if (!isManager) return;
    
    try {
      const { error } = await supabase
        .from('members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      loadMembers();
      setMessage(t.success + '! Role updated.');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t.members}</h2>
        <div className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
          <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
            {t.messCode}: <span className="font-bold text-lg">{mess.mess_code}</span>
          </p>
        </div>
      </div>

      {/* Invitation Form - Manager Only */}
      {isManager && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {t.inviteMembers || 'Invite Members'}
          </h3>
          <form onSubmit={handleSendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder={t.memberName}
                required
                className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t.email}
                required
                className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? t.loading : t.sendInvitation}
              </button>
            </div>
          </form>
          {message && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
        </div>
      )}

      {/* Pending Requests - Manager Only */}
      {isManager && invitations.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
          <h3 className="text-xl font-bold mb-4">{t.pendingRequests || 'Pending Requests'}</h3>
          <div className="space-y-3">
            {invitations.map(invitation => (
              <div
                key={invitation.id}
                className={`p-4 rounded-lg flex items-center justify-between ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <div>
                  <p className="font-bold">{invitation.invitee_name || invitation.invitee_email}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {invitation.invitee_email}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                    {invitation.invitation_type === 'join_request' ? 'Join Request' : 'Email Invite'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveRequest(invitation)}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    title={t.approve}
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(invitation.id)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    title={t.reject}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(memberItem => (
          <div key={memberItem.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold">{memberItem.name}</h3>
                  {memberItem.role === 'manager' && (
                    <Crown className="w-5 h-5 text-yellow-500" title={t.messManager} />
                  )}
                  {memberItem.role === 'second_in_command' && (
                    <Shield className="w-5 h-5 text-blue-500" title={t.secondInCommand} />
                  )}
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {memberItem.email}
                </p>
                {memberItem.phone && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {memberItem.country_code} {memberItem.phone}
                  </p>
                )}
                
                {/* Role Badge */}
                <span className={`inline-block mt-3 px-3 py-1 text-xs rounded-full ${
                  memberItem.role === 'manager' 
                    ? 'bg-yellow-500 text-white' 
                    : memberItem.role === 'second_in_command'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {memberItem.role === 'manager' 
                    ? t.messManager 
                    : memberItem.role === 'second_in_command' 
                    ? t.secondInCommand 
                    : t.member}
                </span>
              </div>
            </div>

            {/* Change Role - Manager Only */}
            {isManager && memberItem.id !== member.id && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <label className={`block text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Change Role
                </label>
                <select
                  value={memberItem.role}
                  onChange={(e) => handleChangeRole(memberItem.id, e.target.value)}
                  className={`w-full p-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                >
                  <option value="member">{t.member}</option>
                  <option value="second_in_command">{t.secondInCommand}</option>
                  {member.role === 'manager' && (
                    <option value="manager">{t.messManager}</option>
                  )}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Members;
