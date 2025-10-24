// ============================================
//src/context/AuthContext.jsx
// ============================================
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Load user data with retry logic
  const loadUserData = async (user, retries = 3) => {
    try {
      console.log('Loading user data for:', user.id);
      
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*, messs(*)')
        .eq('user_id', user.id)
        .single();

      if (memberError) {
        console.error('Member error:', memberError);
        if (retries > 0) {
          console.log(`Retrying... ${retries} attempts left`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadUserData(user, retries - 1);
        }
        throw memberError;
      }

      if (memberData) {
        setMember(memberData);
        setMess(memberData.messs);
        
        // Store in localStorage for persistence
        localStorage.setItem('current_member', JSON.stringify(memberData));
        localStorage.setItem('current_mess', JSON.stringify(memberData.messs));
        console.log('User data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      if (retries > 0) {
        console.log(`Retrying loadUserData... ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return loadUserData(user, retries - 1);
      }
    }
  };

  // Restore from localStorage on component mount
  useEffect(() => {
    const savedMember = localStorage.getItem('current_member');
    const savedMess = localStorage.getItem('current_mess');
    
    if (savedMember && savedMess) {
      try {
        const memberData = JSON.parse(savedMember);
        const messData = JSON.parse(savedMess);
        
        setMember(memberData);
        setMess(messData);
        console.log('Restored from localStorage');
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
        localStorage.removeItem('current_member');
        localStorage.removeItem('current_mess');
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 10000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserData(session.user);
        } else {
          // Clear any stale data
          localStorage.removeItem('current_member');
          localStorage.removeItem('current_mess');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Don't block the app on initialization errors
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
          console.log('Auth initialization complete');
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setMember(null);
        setMess(null);
        localStorage.removeItem('current_member');
        localStorage.removeItem('current_mess');
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem('current_member');
      localStorage.removeItem('current_mess');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    member,
    mess,
    session,
    loading: loading && !initialized,
    signOut,
    refreshData: () => user && loadUserData(user)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
