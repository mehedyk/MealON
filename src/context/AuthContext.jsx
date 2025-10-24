// ============================================
// src/context/AuthContext.jsx - COMPLETE FIXED VERSION
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
  // CRITICAL: Check cache BEFORE setting initial loading state
  const getInitialLoadingState = () => {
    try {
      const cachedMess = localStorage.getItem('mess_cache');
      const cachedMember = localStorage.getItem('member_cache');
      
      // If we have cache, start with loading = false
      if (cachedMess && cachedMember) {
        console.log('📦 Cache found - starting with loading=false');
        return false;
      }
    } catch (err) {
      console.error('Cache check error:', err);
    }
    return true; // No cache, need to load
  };

  const [user, setUser] = useState(null);
  const [member, setMember] = useState(() => {
    try {
      const cached = localStorage.getItem('member_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [mess, setMess] = useState(() => {
    try {
      const cached = localStorage.getItem('mess_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(getInitialLoadingState());
  const [error, setError] = useState(null);
  
  const initialized = useRef(false);
  const loadingTimeout = useRef(null);
  const lastVisibilityChange = useRef(Date.now());

  // Safety: Force stop loading after 5 seconds
  useEffect(() => {
    if (loading) {
      loadingTimeout.current = setTimeout(() => {
        console.warn('⚠️ Loading timeout (5s) - forcing stop');
        setLoading(false);
      }, 5000); // Reduced from 10 seconds
    }

    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, [loading]);

  // CRITICAL: Handle tab visibility changes AGGRESSIVELY
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastChange = Date.now() - lastVisibilityChange.current;
        
        console.log('🔄 Tab became visible after', timeSinceLastChange, 'ms');
        console.log('Current state:', { user: !!user, member: !!member, mess: !!mess, loading });
        
        // CRITICAL: If loading when tab becomes visible, FORCE STOP immediately
        if (loading) {
          console.warn('⚠️ FORCING LOADING TO STOP - tab became visible');
          setLoading(false);
        }
        
        // If we have cache but no user, try to restore auth silently
        if (!user && member && mess && timeSinceLastChange > 1000) {
          console.log('🔄 Attempting silent auth restore...');
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              console.log('✅ Auth restored silently');
              setUser(session.user);
            }
          });
        }
      }
      
      lastVisibilityChange.current = Date.now();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [user, member, mess, loading]);

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;
    let authSubscription = null;

    const init = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        // Check if we have cache - if yes, don't show loading spinner
        const hasCachedData = member && mess;
        
        if (!hasCachedData) {
          setLoading(true);
        }
        
        // Clear loading timeout
        if (loadingTimeout.current) {
          clearTimeout(loadingTimeout.current);
        }
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          
          // If we have cached data and it's a network error, use cache
          if (hasCachedData && (sessionError.message.includes('Failed to fetch') || sessionError.message.includes('NetworkError'))) {
            console.log('📦 Using cached data due to network error');
            setLoading(false);
            return;
          }
          
          if (mounted) {
            setLoading(false);
            setError(sessionError.message);
          }
          return;
        }

        if (!session?.user) {
          console.log('❌ No session found');
          
          // If we have cache but no session, keep the cached data
          if (hasCachedData) {
            console.log('📦 Keeping cached data despite no session');
            setLoading(false);
            return;
          }
          
          if (mounted) {
            setUser(null);
            setMember(null);
            setMess(null);
            setLoading(false);
            // Clear cache
            localStorage.removeItem('mess_cache');
            localStorage.removeItem('member_cache');
          }
          return;
        }

        console.log('✅ Session found for:', session.user.email);
        
        if (mounted) {
          setUser(session.user);
        }

        // Load member data with timeout
        const memberPromise = supabase
          .from('members')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Member fetch timeout')), 5000)
        );

        const { data: memberData, error: memberError } = await Promise.race([
          memberPromise,
          timeoutPromise
        ]).catch(err => {
          console.error('Member fetch failed:', err);
          return { data: null, error: err };
        });

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
        
        // Cache member data
        localStorage.setItem('member_cache', JSON.stringify(memberData));

        // Load mess data with timeout
        if (memberData.mess_id) {
          const messPromise = supabase
            .from('mess')
            .select('*')
            .eq('id', memberData.mess_id)
            .single();

          const messTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Mess fetch timeout')), 5000)
          );

          const { data: messData, error: messError } = await Promise.race([
            messPromise,
            messTimeoutPromise
          ]).catch(err => {
            console.error('Mess fetch failed:', err);
            return { data: null, error: err };
          });

          if (!mounted) return;

          if (messError) {
            console.error('Mess error:', messError);
          } else if (messData) {
            console.log('✅ Mess found:', messData.name);
            setMess(messData);
            
            // Cache mess data
            localStorage.setItem('mess_cache', JSON.stringify(messData));
          }
        }

        setLoading(false);
        console.log('✅ Auth initialization complete');

      } catch (err) {
        console.error('❌ Init error:', err);
        if (mounted) {
          setLoading(false);
          setError(err.message);
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
              localStorage.setItem('member_cache', JSON.stringify(memberData));

              if (memberData.mess_id) {
                const { data: messData } = await supabase
                  .from('mess')
                  .select('*')
                  .eq('id', memberData.mess_id)
                  .single();

                if (mounted && messData) {
                  setMess(messData);
                  localStorage.setItem('mess_cache', JSON.stringify(messData));
                }
              }
            }

            if (mounted) setLoading(false);

          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            setUser(null);
            setMember(null);
            setMess(null);
            localStorage.removeItem('mess_cache');
            localStorage.removeItem('member_cache');
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
      
      // Clear loading timeout
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
        loadingTimeout.current = null;
      }
      
      // Unsubscribe from auth
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
      
      // Clear cache
      localStorage.removeItem('mess_cache');
      localStorage.removeItem('member_cache');
      
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
      
      // Cache the data
      localStorage.setItem('mess_cache', JSON.stringify(data.mess));
      localStorage.setItem('member_cache', JSON.stringify(data.member));
      
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
