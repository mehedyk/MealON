// ============================================
// AuthContext.jsx
// ============================================
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Get cache or null
const getCache = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

// Save cache
const setCache = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Cache save error:', err);
  }
};

export const AuthProvider = ({ children }) => {
  // Load from cache FIRST - this prevents loading screen
  const cachedMember = getCache('member_cache');
  const cachedMess = getCache('mess_cache');
  
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(cachedMember);
  const [mess, setMess] = useState(cachedMess);
  const [loading, setLoading] = useState(!cachedMember && !cachedMess); // Only load if NO cache
  const [error, setError] = useState(null);
  
  const initialized = useRef(false);

  // NUCLEAR: Stop loading after 2 seconds NO MATTER WHAT
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ NUCLEAR: Force stopping loading after 2s');
        setLoading(false);
      }
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [loading]);

  // NUCLEAR: On ANY interaction, stop loading
  useEffect(() => {
    const stopLoading = () => {
      if (loading) {
        console.warn('⚠️ NUCLEAR: User interaction detected, stopping loading');
        setLoading(false);
      }
    };

    window.addEventListener('click', stopLoading, { once: true });
    window.addEventListener('keydown', stopLoading, { once: true });
    
    return () => {
      window.removeEventListener('click', stopLoading);
      window.removeEventListener('keydown', stopLoading);
    };
  }, [loading]);

  // NUCLEAR: On tab visibility, IMMEDIATELY stop loading
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && loading) {
        console.warn('⚠️ NUCLEAR: Tab visible, force stopping loading');
        setLoading(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loading]);

  // Initialize auth - but don't block UI if we have cache
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        console.log('🚀 Init auth (cache:', !!cachedMember, !!cachedMess, ')');
        
        // If we have cache, we're DONE - show UI immediately
        if (cachedMember && cachedMess) {
          console.log('✅ Using cache, skipping auth check');
          setLoading(false);
          
          // Try to get user in background (non-blocking)
          supabase.auth.getSession().then(({ data }) => {
            if (data?.session?.user) {
              setUser(data.session.user);
            }
          }).catch(() => {});
          
          return; // DONE
        }

        // No cache - need to load (but with timeout)
        const sessionPromise = supabase.auth.getSession();
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeout])
          .catch(() => ({ data: { session: null } }));

        if (!session?.user) {
          console.log('❌ No session');
          setLoading(false);
          return;
        }

        console.log('✅ Session found');
        setUser(session.user);

        // Load member
        const { data: memberData } = await supabase
          .from('members')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (memberData) {
          setMember(memberData);
          setCache('member_cache', memberData);

          // Load mess
          if (memberData.mess_id) {
            const { data: messData } = await supabase
              .from('mess')
              .select('*')
              .eq('id', memberData.mess_id)
              .single();

            if (messData) {
              setMess(messData);
              setCache('mess_cache', messData);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Init error:', err);
        setLoading(false);
      }
    };

    init();

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setMember(null);
        setMess(null);
        localStorage.removeItem('member_cache');
        localStorage.removeItem('mess_cache');
      }
    });

    return () => subscription.unsubscribe();
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
      setUser(null);
      setMember(null);
      setMess(null);
      localStorage.clear();
      await supabase.auth.signOut();
      window.location.href = '/';
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
      setCache('mess_cache', data.mess);
      setCache('member_cache', data.member);
      
      return { data: data.mess, error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  };

  const joinMess = async (messCode) => {
    try {
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
