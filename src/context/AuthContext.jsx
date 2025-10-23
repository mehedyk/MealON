// ============================================
//src/context/AuthContext.jsx
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
  
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;
    let authSubscription = null;

    const init = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) setLoading(false);
          return;
        }

        if (!session?.user) {
          console.log('❌ No session found');
          if (mounted) {
            setUser(null);
            setMember(null);
            setMess(null);
            setLoading(false);
          }
          return;
        }

        console.log('✅ Session found for:', session.user.email);
        
        if (mounted) {
          setUser(session.user);
        }

        // Load member data
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!mounted) return;

        if (memberError) {
          console.error('Member error:', memberError);
          setLoading(false);
          return;
        }

        if (!memberData) {
          console.log('⚠️ No member found - showing setup');
          setLoading(false);
          return;
        }

        console.log('✅ Member found:', memberData.name);
        setMember(memberData);

        // Load mess data
        if (memberData.mess_id) {
          const { data: messData, error: messError } = await supabase
            .from('mess')
            .select('*')
            .eq('id', memberData.mess_id)
            .single();

          if (!mounted) return;

          if (messError) {
            console.error('Mess error:', messError);
          } else if (messData) {
            console.log('✅ Mess found:', messData.name);
            setMess(messData);
          }
        }

        setLoading(false);
        console.log('✅ Auth initialization complete');

      } catch (err) {
        console.error('❌ Init error:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth listener
    const setupListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔔 Auth event:', event);

          if (!mounted) return;

          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in');
            setLoading(true);
            setUser(session.user);

            // Load member data
            const { data: memberData } = await supabase
              .from('members')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (mounted && memberData) {
              setMember(memberData);

              if (memberData.mess_id) {
                const { data: messData } = await supabase
                  .from('mess')
                  .select('*')
                  .eq('id', memberData.mess_id)
                  .single();

                if (mounted && messData) {
                  setMess(messData);
                }
              }
            }

            if (mounted) setLoading(false);

          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            setUser(null);
            setMember(null);
            setMess(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 Token refreshed');
            setUser(session.user);
          }
        }
      );

      authSubscription = subscription;
    };

    init();
    setupListener();

    // Cleanup
    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []); // CRITICAL: Empty array - run ONCE

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
      setUser(null);
      setMember(null);
      setMess(null);
      await supabase.auth.signOut();
      
      // Force reload to clear all state
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
