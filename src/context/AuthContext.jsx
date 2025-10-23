// ============================================
// AuthContext
// ============================================
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const hasInitialized = useRef(false);
  const isLoading = useRef(false);

  // Load member data - NEVER changes loading state
  const loadMemberDataSilently = async (userId) => {
    if (!userId || isLoading.current) return;
    
    isLoading.current = true;

    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (memberData) {
        setMember(memberData);

        if (memberData.mess_id) {
          const { data: messData } = await supabase
            .from('mess')
            .select('*')
            .eq('id', memberData.mess_id)
            .single();

          if (messData) {
            setMess(messData);
          }
        }
      }
    } catch (err) {
      console.error('Silent load error:', err);
    } finally {
      isLoading.current = false;
    }
  };

  // Initialize ONCE
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    let subscription;

    const init = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          await loadMemberDataSilently(session.user.id);
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        // CRITICAL: Always set loading to false
        setLoading(false);
      }
    };

    // Listen to auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setLoading(true);
          await loadMemberDataSilently(session.user.id);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setMember(null);
          setMess(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Silent refresh - don't change loading state
          setUser(session.user);
        }
      }
    );

    subscription = authSubscription;
    init();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // CRITICAL: Empty array - runs ONCE

  const signUp = async (email, password, userData) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: userData }
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setMember(null);
      setMess(null);
      await supabase.auth.signOut();
      window.location.href = '/';
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err.message };
    }
  };

  const createMess = async (messName, userName = null) => {
    try {
      setError(null);
      if (!user) throw new Error('Not authenticated');

      const { data: existingMembers } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingMembers?.length > 0) {
        throw new Error('You already have a mess!');
      }

      const memberName = userName || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      
      const { data, error } = await supabase.rpc('create_mess_with_member', {
        p_mess_name: messName.trim(),
        p_user_id: user.id,
        p_name: memberName.trim(),
        p_email: user.email.trim(),
        p_phone: user.user_metadata?.phone || '',
        p_country_code: user.user_metadata?.country_code || '+880'
      });

      if (error) throw error;

      setMess(data.mess);
      setMember(data.member);
      
      return { data: data.mess, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const joinMess = async (messCode) => {
    try {
      setError(null);
      if (!user) throw new Error('Not authenticated');

      const userName = user.user_metadata?.name || user.email.split('@')[0];

      const { data, error } = await supabase.rpc('join_mess_with_code', {
        p_mess_code: messCode.trim(),
        p_user_id: user.id,
        p_user_email: user.email,
        p_user_name: userName
      });

      if (error) throw error;
      
      if (data.already_member) {
        await loadMemberDataSilently(user.id);
      }
      
      return { data, error: null };
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
    joinMess
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
