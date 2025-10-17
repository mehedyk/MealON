// ============================================
// FILE: src/components/Members.jsx - COMPLETE FIXED VERSION
// ============================================
import React, { useState, useEffect } from 'react';
import { Mail, UserPlus, Check, X, Crown, Shield, RefreshCw } from 'lucide-react';
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
    if (isManager) {
      loadInvitations();
    }
    
    // Set up realtime subscription for members
    const membersChannel = supabase
      .channel('members_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'members',
        filter: `mess_id=eq.${mess.id}`
      }, () => {
        console.log('🔔 Members changed, reloading...');
        loadMembers();
      })
      .subscribe();

    return () => {
      membersChannel.unsubscribe();
    };
  }, [mess.id]);

  const loadMembers = async () => {
    try {
      console.log('📊 Loading members...');
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('mess_id', mess.id)
        .order('created_at');

      if (error) throw error;
      setMembers(data || []);
      console.log('✅ Members loaded:', data?.length);
    } catch (error) {
      console.error('❌ Error loading members:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      console.log('📊 Loading invitations...');
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('mess_id', mess.id)
        .in('status', ['pending', 'approved_pending_signup'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
      console.log('✅ Invitations loaded:', data?.length);
    } catch (error) {
      console.error('❌ Error loading invitations:', error);
    }
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log('📤 Sending invitation...');
      
      const { error } = await supabase
        .from('invitations')
        .insert([{
          mess_id: mess.id,
          inviter_id: member.id,
          invitee_email: inviteEmail.trim().toLowerCase(),
          invitee_name: inviteName.trim(),
          invitation_type: 'email_invite',
          status: 'pending'
        }]);

      if (error) throw error;

      console.log('✅ Invitation sent');
      setMessage('Invitation sent! They will be added when they sign up.');
      setInviteEmail('');
      setInviteName('');
      loadInvitations();
    } catch (error) {
      console.error('❌ Error:', error);
      if (error.code === '23505') {
        setMessage('Error: This user already has a pending invitation!');
      } else {
        setMessage('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (invitation) => {
    try {
      console.log('🔍 Approving:', invitation.invitee_email);
      setMessage('');

      const { data, error } = await supabase.rpc('approve_join_request', {
        p_invitation_id: invitation.id,
        p_approver_id: member.id
      });

      if (error) {
        console.error('❌ Approve error:', error);
        throw error;
      }

      console.log('📊 Approval result:', data);

      if (data.success) {
        setMessage('✅ Member approved successfully!');
        loadMembers();
        loadInvitations();
      } else {
        setMessage('⚠️ ' + data.message);
      }
    } catch (error) {
      console.error('❌ Approval error:', error);
      setMessage('Error: ' + error.message);
    }
  };

  const handleRejectRequest = async (invitationId) => {
    try {
      console.log('❌ Rejecting invitation:', invitationId);
      
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;
      
      console.log('✅ Rejected');
      setMessage('Request rejected.');
      loadInvitations();
    } catch (error) {
      console.error('❌ Error:', error);
      setMessage('Error: ' + error.message);
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    if (!isManager) return;
    
    try {
      console.log('🔄 Changing role...');
      
      const { error } = await supabase
        .from('members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      
      console.log('✅ Role updated');
      setMessage('Role updated successfully!');
      loadMembers();
    } catch (error) {
      console.error('❌ Error:', error);
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t.members}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadMembers();
              loadInvitations();
            }}
            className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition`}
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
            <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
              {t.messCode}: <span className="font-bold text-lg">{mess.mess_code}</span>
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.includes('Error') || message.includes('⚠️')
            ? 'bg-red-100 text-red-700 border border-red-300'
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {message}
        </div>
      )}

      {isManager && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {t.inviteMembers || 'Invite Members'}
          </h3>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            💡 Invited users will be automatically added when they sign up with this email.
          </p>
          <form onSubmit={handleSendInvitation} className="space-y-4">
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
                className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isManager && invitations.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg mb-6`}>
          <h3 className="text-xl font-bold mb-4">Pending Requests</h3>
          <div className="space-y-3">
            {invitations.map(invitation => (
              <div
                key={invitation.id}
                className={`p-4 rounded-lg flex items-center justify-between ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <div>
                  <p className="font-bold">{invitation.invitee_name}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {invitation.invitee_email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invitation.status === 'approved_pending_signup'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {invitation.status === 'approved_pending_signup' 
                        ? '⏳ Approved - Waiting for signup'
                        : invitation.invitation_type === 'join_request' 
                        ? '📬 Join Request' 
                        : '📧 Email Invite'}
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveRequest(invitation)}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    title="Approve"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(invitation.id)}
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
        {members.map(memberItem => (
          <div key={memberItem.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-lg`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold">{memberItem.name}</h3>
                  {memberItem.role === 'manager' && (
                    <Crown className="w-5 h-5 text-yellow-500" title="Manager" />
                  )}
                  {memberItem.role === 'second_in_command' && (
                    <Shield className="w-5 h-5 text-blue-500" title="Second-in-Command" />
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
                
                <span className={`inline-block mt-3 px-3 py-1 text-xs rounded-full ${
                  memberItem.role === 'manager' 
                    ? 'bg-yellow-500 text-white' 
                    : memberItem.role === 'second_in_command'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-500 text-white'
                }`}>
                  {memberItem.role === 'manager' 
                    ? 'Manager' 
                    : memberItem.role === 'second_in_command' 
                    ? 'Second-in-Command' 
                    : 'Member'}
                </span>
              </div>
            </div>

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
                  <option value="member">Member</option>
                  <option value="second_in_command">Second-in-Command</option>
                  {member.role === 'manager' && (
                    <option value="manager">Manager</option>
                  )}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl`}>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No members yet. Invite someone to get started!
          </p>
        </div>
      )}
    </div>
  );
};

export default Members;
