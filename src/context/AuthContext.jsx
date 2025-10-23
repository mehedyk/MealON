// ============================================
// AuthContext
// ============================================
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
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
  
  // Critical: Prevent multiple loads
  const isLoadingData = useRef(false);
  const mountedRef = useRef(true);

  // Load member data WITHOUT triggering loading state
  const loadMemberData = useCallback(async (userId) => {
    if (!userId || isLoadingData.current || !mountedRef.current) {
      return;
    }

    isLoadingData.current = true;

    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('Member error:', memberError);
        setMember(null);
        setMess(null);
        return;
      }
      
      if (!memberData) {
        setMember(null);
        setMess(null);
        return;
      }

      setMember(memberData);

      if (memberData.mess_id) {
        const { data: messData, error: messError } = await supabase
          .from('mess')
          .select('*')
          .eq('id', memberData.mess_id)
          .single();

        if (!mountedRef.current) return;

        if (!messError && messData) {
          setMess(messData);
        }
      }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      isLoadingData.current = false;
    }
  }, []);

  // Initialize auth ONCE
  useEffect(() => {
    let subscription;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mountedRef.current) {
          setUser(session.user);
          await loadMemberData(session.user.id);
        }
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    // Auth state listener
    const setupAuthListener = () => {
      const { data: authData } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mountedRef.current) return;

          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            setLoading(true);
            await loadMemberData(session.user.id);
            setLoading(false);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setMember(null);
            setMess(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser(session.user);
          }
        }
      );
      subscription = authData.subscription;
    };

    initAuth();
    setupAuthListener();

    return () => {
      mountedRef.current = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // CRITICAL: Empty deps - run ONCE only

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
      setError(null);
      
      setUser(null);
      setMember(null);
      setMess(null);
      
      localStorage.clear();
      sessionStorage.clear();
      
      await supabase.auth.signOut();
      
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
      return { error: null };
    } catch (err) {
      console.error('Sign out error:', err);
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
        .select('id, mess_id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingMembers && existingMembers.length > 0) {
        await loadMemberData(user.id);
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
        await loadMemberData(user.id);
      }
      
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const reloadMemberData = useCallback(async () => {
    if (user && !isLoadingData.current) {
      await loadMemberData(user.id);
    }
  }, [user, loadMemberData]);

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
    reloadMemberData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
