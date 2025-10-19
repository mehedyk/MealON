// ============================================
// FIXED AuthContext - Handles session timeout & prevents loading loops
// ============================================
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
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

  // Memoized function to prevent re-renders
  const loadMemberData = useCallback(async (userId) => {
    if (!userId) {
      setMember(null);
      setMess(null);
      return;
    }

    try {
      console.log('🔄 Loading member data for:', userId);
      
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (memberError && memberError.code !== 'PGRST116') {
        console.error('❌ Member error:', memberError);
        setMember(null);
        setMess(null);
        return;
      }
      
      if (!memberData) {
        console.log('⚠️ No member found - user needs to create/join mess');
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
  }, []);

  // Check session on mount and visibility change
  useEffect(() => {
    let mounted = true;
    let visibilityTimeout;

    const checkSession = async () => {
      try {
        console.log('🔍 Checking session...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (mounted) {
            setUser(null);
            setMember(null);
            setMess(null);
            setLoading(false);
            setSessionChecked(true);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Valid session:', session.user.email);
          setUser(session.user);
          await loadMemberData(session.user.id);
        } else {
          console.log('⚠️ No active session');
          if (mounted) {
            setUser(null);
            setMember(null);
            setMess(null);
          }
        }
      } catch (err) {
        console.error('❌ Session check error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
          setSessionChecked(true);
        }
      }
    };

    // Initial check
    checkSession();

    // Handle visibility change (tab switching, coming back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab visible - refreshing session');
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          checkSession();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.email);
          setUser(session.user);
          setLoading(true);
          await loadMemberData(session.user.id);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setMember(null);
          setMess(null);
          localStorage.clear();
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          if (session?.user) {
            setUser(session.user);
          }
        } else if (event === 'USER_UPDATED') {
          console.log('📝 User updated');
          if (session?.user) {
            setUser(session.user);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(visibilityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, [loadMemberData]);

  const signUp = async (email, password, userData) => {
    try {
      setError(null);
      setLoading(true);
      console.log('📝 Signing up:', email);
      
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
      
      console.log('✅ Signup successful');
      return { data, error: null };
    } catch (err) {
      console.error('❌ Signup error:', err);
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
      console.log('🔐 Signing in:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      console.log('✅ Login successful');
      return { data, error: null };
    } catch (err) {
      console.error('❌ Login error:', err);
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
      console.log('👋 Signing out...');
      
      // Clear state immediately
      setUser(null);
      setMember(null);
      setMess(null);
      localStorage.clear();
      sessionStorage.clear();
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Don't throw - we already cleared local state
      }
      
      console.log('✅ Signed out successfully');
      
      // Force reload to clear any cached state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
      return { error: null };
    } catch (err) {
      console.error('❌ Sign out error:', err);
      // Still clear local state even if sign out fails
      setUser(null);
      setMember(null);
      setMess(null);
      localStorage.clear();
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
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Checking if user already has a mess...');
      
      const { data: existingMembers } = await supabase
        .from('members')
        .select('id, mess_id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingMembers && existingMembers.length > 0) {
        console.log('⚠️ User already has a mess! Reloading...');
        await loadMemberData(user.id);
        throw new Error('You already have a mess!');
      }

      const memberName = userName || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'User';
      
      console.log('📝 Creating mess:', messName);
      
      const params = {
        p_mess_name: messName.trim(),
        p_user_id: user.id,
        p_name: memberName.trim(),
        p_email: user.email.trim(),
        p_phone: user.user_metadata?.phone || '',
        p_country_code: user.user_metadata?.country_code || '+880'
      };
      
      const { data, error } = await supabase.rpc('create_mess_with_member', params);

      if (error) {
        console.error('❌ RPC Error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Mess created:', data);

      setMess(data.mess);
      setMember(data.member);
      
      return { data: data.mess, error: null };
    } catch (err) {
      console.error('❌ Create mess failed:', err);
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const joinMess = async (messCode) => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Joining mess with code:', messCode);

      const userName = user.user_metadata?.name || user.email.split('@')[0];

      const { data, error } = await supabase.rpc('join_mess_with_code', {
        p_mess_code: messCode.trim(),
        p_user_id: user.id,
        p_user_email: user.email,
        p_user_name: userName
      });

      if (error) {
        console.error('❌ Join error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Join response:', data);
      
      if (data.already_member) {
        await loadMemberData(user.id);
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('❌ Join mess error:', err);
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const reloadMemberData = useCallback(async () => {
    if (user) {
      console.log('🔄 Manually reloading member data...');
      setLoading(true);
      await loadMemberData(user.id);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
