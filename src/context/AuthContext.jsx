// ============================================
// FILE 1: src/context/AuthContext.jsx
// ============================================
import React, { createContext, useState, useEffect, useContext } from 'react';
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

  const loadMemberData = async (userId) => {
    try {
      console.log('🔄 Loading member data for:', userId);
      
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (memberError) {
        console.error('❌ Member error:', memberError);
        setMember(null);
        setMess(null);
        return;
      }
      
      if (!memberData) {
        console.log('⚠️ No member found');
        setMember(null);
        setMess(null);
        return;
      }

      console.log('✅ Member found:', memberData.name);
      setMember(memberData);

      if (memberData.mess_id) {
        const { data: messData, error: messError } = await supabase
          .from('mess')
          .select('*')
          .eq('id', memberData.mess_id)
          .single();

        if (!messError && messData) {
          console.log('✅ Mess loaded:', messData.name);
          setMess(messData);
        }
      }
    } catch (err) {
      console.error('❌ Load error:', err);
      setMember(null);
      setMess(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          setUser(session.user);
          await loadMemberData(session.user.id);
        }
      } catch (err) {
        console.error('❌ Init error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadMemberData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setMember(null);
          setMess(null);
        }
      }
    );

    initAuth();
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: userData }
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMember(null);
      setMess(null);
      localStorage.clear();
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: err.message };
    }
  };

  const createMess = async (messName, userName = null) => {
    try {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await loadMemberData(user.id);
        throw new Error('You already have a mess!');
      }

      const memberName = userName || user.user_metadata?.name || user.email.split('@')[0];
      
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
      return { data: null, error: err.message };
    }
  };

  const joinMess = async (messCode) => {
    try {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('join_mess_with_code', {
        p_mess_code: messCode.trim(),
        p_user_id: user.id,
        p_user_email: user.email,
        p_user_name: user.user_metadata?.name || user.email.split('@')[0]
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
