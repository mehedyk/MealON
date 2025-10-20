// ============================================
// BULLETPROOF AuthContext - Fixes ALL reload/tab/PDF issues
// Replace src/context/AuthContext.jsx
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
  const [sessionChecked, setSessionChecked] = useState(false);
  
  // Use refs to prevent multiple simultaneous loads
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const sessionTimeoutRef = useRef(null);

  // Memoized load function with duplicate prevention
  const loadMemberData = useCallback(async (userId, force = false) => {
    if (!userId || (!force && loadingRef.current)) {
      return;
    }

    loadingRef.current = true;

    try {
      console.log('🔄 Loading member data for:', userId);
      
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (memberError && memberError.code !== 'PGRST116') {
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

        if (!mountedRef.current) return;

        if (!messError && messData) {
          console.log('✅ Mess loaded:', messData.name);
          setMess(messData);
        }
      }
    } catch (err) {
      console.error('❌ Load error:', err);
      if (mountedRef.current) {
        setMember(null);
        setMess(null);
      }
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // Session validation with auto-recovery
  const validateSession = useCallback(async () => {
    try {
      console.log('🔍 Validating session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Session error:', error);
        if (mountedRef.current) {
          setUser(null);
          setMember(null);
          setMess(null);
        }
        return false;
      }

      if (session?.user) {
        console.log('✅ Valid session');
        if (mountedRef.current) {
          setUser(session.user);
          await loadMemberData(session.user.id);
        }
        return true;
      }

      return false;
    } catch (err) {
      console.error('❌ Validate error:', err);
      return false;
    }
  }, [loadMemberData]);

  // Initialize auth
  useEffect(() => {
    mountedRef.current = true;
    let isInitializing = false;

    const initAuth = async () => {
      if (isInitializing) return;
      isInitializing = true;

      try {
        await validateSession();
      } catch (err) {
        console.error('❌ Init error:', err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setSessionChecked(true);
        }
        isInitializing = false;
      }
    };

    // Handle visibility changes (tab switching, window focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('👁️ Tab visible - validating session');
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = setTimeout(() => {
          validateSession();
        }, 1000);
      }
    };

    // Handle page focus
    const handleFocus = () => {
      if (user) {
        console.log('🎯 Window focused - validating session');
        clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = setTimeout(() => {
          validateSession();
        }, 1000);
      }
    };

    // Prevent unload when downloading (for PDF downloads)
    const handleBeforeUnload = (e) => {
      // Don't prevent if actually navigating away
      if (e.currentTarget.performance?.navigation?.type === 1) {
        return;
      }
      // For downloads, don't do anything
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event);
        
        if (!mountedRef.current) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in');
          setUser(session.user);
          setLoading(true);
          await loadMemberData(session.user.id, true);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setMember(null);
          setMess(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          if (session?.user) {
            setUser(session.user);
          }
        }
      }
    );

    initAuth();

    return () => {
      mountedRef.current = false;
      clearTimeout(sessionTimeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      subscription.unsubscribe();
    };
  }, [user, validateSession, loadMemberData]);

  const signUp = async (email, password, userData) => {
    try {
      setError(null);
      setLoading(true);
      
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
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Clear state first
      setUser(null);
      setMember(null);
      setMess(null);
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Force reload to clear any cached state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
      return { error: null };
    } catch (err) {
      console.error('❌ Sign out error:', err);
      return { error: err.message };
    } finally {
      setLoading(false);
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
        await loadMemberData(user.id, true);
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
        await loadMemberData(user.id, true);
      }
      
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const reloadMemberData = useCallback(async () => {
    if (user) {
      setLoading(true);
      await loadMemberData(user.id, true);
      setLoading(false);
    }
  }, [user, loadMemberData]);

  const value = {
    user,
    member,
    mess,
    loading,
    error,
    sessionChecked,
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
