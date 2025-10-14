// ============================================
// FILE: src/context/AuthContext.jsx - FIXED VERSION
// Better state management and error handling
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

  // Load member data with better error handling
  const loadMemberData = async (userId) => {
    try {
      console.log('🔄 Loading member data for user:', userId);
      
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          mess (*)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error loading member:', error);
        // Don't throw - user might not have a mess yet
        setMember(null);
        setMess(null);
        return;
      }
      
      if (data) {
        console.log('✅ Member data loaded:', data);
        setMember(data);
        setMess(data.mess);
      } else {
        console.log('⚠️ No member data found');
        setMember(null);
        setMess(null);
      }
    } catch (err) {
      console.error('❌ Unexpected error loading member:', err);
      setMember(null);
      setMess(null);
    }
  };

  // Initialize auth and set up listener
  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (mounted) setLoading(false);
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Session found:', session.user.email);
          setUser(session.user);
          await loadMemberData(session.user.id);
        } else {
          console.log('⚠️ No active session');
        }
      } catch (err) {
        console.error('❌ Init auth error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('✅ Auth initialization complete');
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.email);
          setUser(session.user);
          await loadMemberData(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setMember(null);
          setMess(null);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          if (session?.user) {
            setUser(session.user);
            // Reload member data on token refresh
            await loadMemberData(session.user.id);
          }
        }
      }
    );

    authSubscription = subscription;
    initAuth();

    // Cleanup
    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Sign up
  const signUp = async (email, password, userData) => {
    try {
      setError(null);
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
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  // Sign in
  const signIn = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Auth state listener will handle loading member data
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      console.log('👋 Signing out...');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear state immediately
      setUser(null);
      setMember(null);
      setMess(null);
      
      // Clear localStorage
      localStorage.clear();
      
      console.log('✅ Signed out successfully');
      return { error: null };
    } catch (err) {
      console.error('❌ Sign out error:', err);
      setError(err.message);
      return { error: err.message };
    }
  };

  // Reset password
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

  // Create mess
  const createMess = async (messName, userName = null) => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get name with fallbacks
      const memberName = userName || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'User';
      
      const memberPhone = user.user_metadata?.phone || '';
      const memberCountryCode = user.user_metadata?.country_code || '+880';
      
      console.log('📝 Creating mess...');
      console.log('Mess name:', messName);
      console.log('Member name:', memberName);
      console.log('User ID:', user.id);
      
      // Validate inputs
      if (!messName || messName.trim() === '') {
        throw new Error('Mess name is required');
      }
      if (!memberName || memberName.trim() === '') {
        throw new Error('Your name is required');
      }
      
      const params = {
        p_mess_name: messName.trim(),
        p_user_id: user.id,
        p_name: memberName.trim(),
        p_email: user.email.trim(),
        p_phone: memberPhone,
        p_country_code: memberCountryCode
      };
      
      console.log('📤 Calling RPC...');
      
      // Call the database function
      const { data, error } = await supabase.rpc('create_mess_with_member', params);

      if (error) {
        console.error('❌ RPC Error:', error);
        throw new Error(error.message);
      }

      console.log('✅ RPC Success:', data);

      // Extract mess and member from response
      const messData = data.mess;
      const memberData = data.member;

      // Update state immediately
      setMess(messData);
      setMember(memberData);
      
      console.log('✅ State updated with new mess');
      
      return { data: messData, error: null };
    } catch (err) {
      console.error('❌ Create mess failed:', err);
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  // Join mess
  const joinMess = async (messCode) => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Looking for mess with code:', messCode);
      
      const { data: messData, error: messError } = await supabase
        .from('mess')
        .select('*')
        .eq('mess_code', messCode.trim())
        .single();

      if (messError || !messData) {
        throw new Error('Invalid mess code');
      }

      console.log('✅ Mess found:', messData.name);

      const { data: inviteData, error: inviteError } = await supabase
        .from('invitations')
        .insert([{
          mess_id: messData.id,
          invitee_email: user.email,
          invitee_name: user.user_metadata?.name || user.email.split('@')[0],
          invitation_type: 'join_request',
          status: 'pending'
        }])
        .select()
        .single();

      if (inviteError) throw inviteError;

      console.log('✅ Join request sent');
      return { data: inviteData, error: null };
    } catch (err) {
      console.error('❌ Join mess error:', err);
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  // Manual reload function
  const reloadMemberData = async () => {
    if (user) {
      console.log('🔄 Manually reloading member data...');
      await loadMemberData(user.id);
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
    reloadMemberData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
