// ============================================
// FILE: src/context/AuthContext.jsx - FIXED WITH DB FUNCTION
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

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.error('Auth initialization timeout');
            setLoading(false);
          }
        }, 3000);

        const { data: { session } } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);

        if (session?.user && mounted) {
          setUser(session.user);
          await loadMemberData(session.user.id);
        }
      } catch (err) {
        console.error('Init auth error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user && mounted) {
          setUser(session.user);
          await loadMemberData(session.user.id);
        } else if (mounted) {
          setUser(null);
          setMember(null);
          setMess(null);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loadMemberData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*, mess(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Member load error:', error);
        return;
      }
      
      if (data) {
        setMember(data);
        setMess(data.mess);
      }
    } catch (err) {
      console.error('Error loading member:', err);
    }
  };

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
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setMember(null);
      setMess(null);
      return { error: null };
    } catch (err) {
      setError(err.message);
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
      
      // Get name from multiple sources with fallbacks
      const memberName = userName || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'User';
      
      const memberPhone = user.user_metadata?.phone || '';
      const memberCountryCode = user.user_metadata?.country_code || '+880';
      
      console.log('🔍 DEBUG - User object:', user);
      console.log('🔍 DEBUG - User metadata:', user.user_metadata);
      console.log('🔍 DEBUG - userName param:', userName);
      console.log('🔍 DEBUG - Final memberName:', memberName);
      console.log('🔍 DEBUG - Email:', user.email);
      
      const params = {
        p_mess_name: messName.trim(),
        p_user_id: user.id,
        p_name: memberName.trim(),
        p_email: user.email.trim(),
        p_phone: memberPhone || '',  // Ensure it's never undefined
        p_country_code: memberCountryCode || '+880'  // Ensure it's never undefined
      };
      
      console.log('📤 Sending to database:', params);
      console.log('📤 Types check:', {
        messName: typeof params.p_mess_name,
        userId: typeof params.p_user_id,
        name: typeof params.p_name,
        email: typeof params.p_email,
        phone: typeof params.p_phone,
        countryCode: typeof params.p_country_code
      });
      
      // Use the database function to create both mess and member atomically
      const { data, error } = await supabase.rpc('create_mess_with_member', params);

      if (error) {
        console.error('❌ RPC Error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Function returned:', data);

      // Extract mess and member from the returned JSON
      const messData = data.mess;
      const memberData = data.member;

      // Update state
      setMess(messData);
      setMember(memberData);
      
      console.log('✅ Mess created successfully:', messData);
      
      return { data: messData, error: null };
    } catch (err) {
      console.error('❌ Create mess failed:', err);
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const joinMess = async (messCode) => {
    try {
      setError(null);
      
      const { data: messData, error: messError } = await supabase
        .from('mess')
        .select('*')
        .eq('mess_code', messCode)
        .single();

      if (messError) throw new Error('Invalid mess code');

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

      return { data: inviteData, error: null };
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
    joinMess,
    reloadMemberData: () => user && loadMemberData(user.id)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
