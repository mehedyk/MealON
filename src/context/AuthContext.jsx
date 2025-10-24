// ============================================
// src/context/AuthContext.jsx
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
  // Initialize from cache immediately - NO loading state
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(() => {
    try {
      const cached = localStorage.getItem('member_cache');
      if (cached) {
        console.log('📦 Loading member from cache');
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Cache read error:', err);
    }
    return null;
  });
  
  const [mess, setMess] = useState(() => {
    try {
      const cached = localStorage.getItem('mess_cache');
      if (cached) {
        console.log('📦 Loading mess from cache');
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Cache read error:', err);
    }
    return null;
  });
  
  // Only show loading if NO cache exists
  const [loading, setLoading] = useState(() => {
    const hasCachedMember = localStorage.getItem('member_cache');
    const hasCachedMess = localStorage.getItem('mess_cache');
    const shouldLoad = !hasCachedMember || !hasCachedMess;
    console.log('Initial loading state:', shouldLoad);
    return shouldLoad;
  });
  
  const [error, setError] = useState(null);
  
  const initialized = useRef(false);
  const loadingTimeout = useRef(null);
  const lastVisibilityChange = useRef(Date.now());

  // CRITICAL: Auto-stop loading after 3 seconds
  useEffect(() => {
    if (loading) {
      console.log('⏰ Setting 3-second loading timeout');
      loadingTimeout.current = setTimeout(() => {
        console.warn('⚠️ FORCING LOADING TO STOP (3s timeout)');
        setLoading(false);
      }, 3000);
    }

    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, [loading]);

  // CRITICAL: Handle tab visibility - FORCE STOP loading immediately
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastChange = Date.now() - lastVisibilityChange.current;
        
        console.log('👁️ Tab visible after', timeSinceLastChange, 'ms');
        console.log('State:', { loading, hasUser: !!user, hasMember: !!member, hasMess: !!mess });
        
        // CRITICAL: If loading when tab visible, STOP IT
        if (loading) {
          console.warn('🛑 FORCING LOADING OFF - tab became visible');
          setLoading(false);
        }
        
        // If we have cache data, ensure loading is off
        if (member && mess) {
          console.log('✅ Have cache data, ensuring loading is OFF');
          setLoading(false);
          
          // Try to restore user session silently in background
          if (!user) {
            supabase.auth.getSession().then(({ data: { session } }) => {
              if (session?.user) {
                console.log('✅ User session restored silently');
                setUser(session.user);
              }
            }).catch(err => {
              console.log('Silent auth restore failed (non-critical):', err.message);
            });
          }
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
  }, [loading, user, member, mess]);

  // Initialize auth - runs ONCE
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;
    let authSubscription = null;

    const init = async () => {
      try {
        console.log('🚀 Starting auth initialization');
        
        // If we have cache, we're already good - just verify auth silently
        const hasCachedData = member && mess;
        
        if (hasCachedData) {
          console.log('📦 Have cached data - skipping loading state');
          setLoading(false);
        }
        
        // Try to get session - but don't block if it fails
        let session = null;
        try {
          const { data: { session: s }, error } = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 3000))
          ]);
          
          if (!error) {
            session = s;
          }
        } catch (err) {
          console.warn('Session fetch failed (non-critical):', err.message);
          
          // If we have cache, it's OK to continue without session
          if (hasCachedData) {
            console.log('✅ Continuing with cached data despite session error');
            return;
          }
        }

        if (!session?.user) {
          console.log('❌ No session');
          
          // If we have cache but no session, keep the cache
          if (hasCachedData) {
            console.log('📦 Keeping cached data (no session)');
            return;
          }
          
          // No cache and no session - clear everything
          if (mounted) {
            setUser(null);
            setMember(null);
            setMess(null);
            setLoading(false);
            localStorage.removeItem('member_cache');
            localStorage.removeItem('mess_cache');
          }
          return;
        }

        console.log('✅ Session found:', session.user.email);
        
        if (mounted) {
          setUser(session.user);
        }

        // If we have cache, we're done
        if (hasCachedData) {
          console.log('✅ Using cached member/mess data');
          return;
        }

        // No cache - need to load from database
        console.log('🔍 Loading member data...');
        
        const { data: memberData, error: memberError } = await Promise.race([
          supabase.from('members').select('*').eq('user_id', session.user.id).maybeSingle(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Member timeout')), 3000))
        ]).catch(err => ({ data: null, error: err }));

        if (!mounted) return;

        if (memberError || !memberData) {
          console.log('⚠️ No member found or error');
          setLoading(false);
          return;
        }

        console.log('✅ Member found:', memberData.name);
        setMember(memberData);
        localStorage.setItem('member_cache', JSON.stringify(memberData));

        // Load mess data
        if (memberData.mess_id) {
          const { data: messData, error: messError } = await Promise.race([
            supabase.from('mess').select('*').eq('id', memberData.mess_id).single(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Mess timeout')), 3000))
          ]).catch(err => ({ data: null, error: err }));

          if (mounted && messData && !messError) {
            console.log('✅ Mess found:', messData.name);
            setMess(messData);
            localStorage.setItem('mess_cache', JSON.stringify(messData));
          }
        }

        if (mounted) {
          setLoading(false);
        }
        
        console.log('✅ Auth initialization complete');

      } catch (err) {
        console.error('❌ Init error:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const setupListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔔 Auth event:', event);

          if (!mounted) return;

          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in');
            setUser(session.user);

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

            setLoading(false);

          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            setUser(null);
            setMember(null);
            setMess(null);
            localStorage.removeItem('member_cache');
            localStorage.removeItem('mess_cache');
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Token refreshed');
            if (session?.user) setUser(session.user);
          }
        }
      );

      authSubscription = subscription;
    };

    init();
    setupListener();

    return () => {
      mounted = false;
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

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
      localStorage.removeItem('member_cache');
      localStorage.removeItem('mess_cache');
      await supabase.auth.signOut();
      setTimeout(() => window.location.href = '/', 100);
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
