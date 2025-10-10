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
          email: invitation.inv
