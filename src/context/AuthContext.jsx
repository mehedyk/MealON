// ============================================
// FILE: src/context/AuthContext.jsx - FIXED
// ============================================
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await loadMemberData(session.user.id);
        } else {
          setUser(null);
          setMember(null);
          setMess(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadMemberData(session.user.id);
      }
    } catch (err) {
      console.error('Error checking user:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberData = async (userId) => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*, mess(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (memberError) {
        console.error('Member load error:', memberError);
        return;
      }
      
      if (memberData) {
        setMember(memberData);
        setMess(memberData.mess);
      }
    } catch (err) {
      console.error('Error loading member data:', err);
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            country_code: userData.country_code
          }
        }
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setMember(null);
      setMess(null);
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err.message };
    }
  };

  const createMess = async (messName) => {
    try {
      setError(null);
      
      // Create mess WITHOUT RLS check
      const { data: messData, error: messError } = await supabase
        .from('mess')
        .insert([{ 
          name: messName,
          created_by: user.id 
        }])
        .select()
        .single();

      if (messError) {
        console.error('Mess creation error:', messError);
        throw messError;
      }

      // Create member entry WITHOUT RLS check
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .insert([{
          user_id: user.id,
          mess_id: messData.id,
          name: user.user_metadata.name || 'User',
          email: user.email,
          phone: user.user_metadata.phone || '',
          country_code: user.user_metadata.country_code || '+880',
          role: 'manager'
        }])
        .select()
        .single();

      if (memberError) {
        console.error('Member creation error:', memberError);
        // Cleanup: delete mess if member creation fails
        await supabase.from('mess').delete().eq('id', messData.id);
        throw memberError;
      }

      setMess(messData);
      setMember(memberData);
      
      // Reload to ensure proper state
      await loadMemberData(user.id);
      
      return { data: messData, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const joinMess = async (messCode) => {
    try {
      setError(null);
      
      const { data: messData, error: messError } = await supabase
        .from('mess')
        .select('*')
        .eq('mess_code', messCode)
        .single();

      if (messError) throw new Error('Invalid mess code');

      const { data: existingMember } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', user.id)
        .eq('mess_id', messData.id)
        .maybeSingle();

      if (existingMember) {
        throw new Error('You are already a member of this mess');
      }

      const { data: inviteData, error: inviteError } = await supabase
        .from('invitations')
        .insert([{
          mess_id: messData.id,
          invitee_email: user.email,
          invitee_name: user.user_metadata.name || 'User',
          invitation_type: 'join_request',
          status: 'pending'
        }])
        .select()
        .single();

      if (inviteError) throw inviteError;

      return { data: inviteData, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const value = {
    user,
    member,
    mess,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    createMess,
    joinMess,
    reloadMemberData: () => user && loadMemberData(user.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
