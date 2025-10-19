// ============================================
// FIXED AuthContext - Handles duplicate members and loading issues
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

  const loadMemberData = async (userId) => {
    try {
      console.log('🔄 Loading member data for:', userId);
      
      // Use .single() instead of .maybeSingle() and handle errors properly
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single();

      // Handle "multiple rows" error specifically
      if (memberError) {
        if (memberError.code === 'PGRST116') {
          // Multiple rows found - get first one
          console.warn('⚠️ Multiple members found, using first one');
          const { data: allMembers, error: multiError } = await supabase
            .from('members')
            .select('*')
            .eq('user_id', userId)
            .limit(1);
          
          if (!multiError && allMembers && allMembers.length > 0) {
            const firstMember = allMembers[0];
            console.log('✅ Using member:', firstMember.name);
            setMember(firstMember);
            
            // Load mess data
            if (firstMember.mess_id) {
              const { data: messData, error: messError } = await supabase
                .from('mess')
                .select('*')
                .eq('id', firstMember.mess_id)
                .single();

              if (!messError && messData) {
                console.log('✅ Mess loaded:', messData.name);
                setMess(messData);
              }
            }
            return;
          }
        }
        
        // No member found
        if (memberError.code === 'PGRST116' || memberError.message?.includes('no rows')) {
          console.log('⚠️ No member found');
          setMember(null);
          setMess(null);
          return;
        }
        
        // Other error
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

      // Load mess data
      if (memberData.mess_id) {
        const { data: messData, error: messError } = await supabase
          .from('mess')
          .select('*')
          .eq('id', memberData.mess_id)
          .single();

        if (!messError && messData) {
          console.log('✅ Mess loaded:', messData.name);
          setMess(messData);
        } else if (messError) {
          console.error('❌ Mess error:', messError);
        }
      }
    } catch (err) {
      console.error('❌ Load error:', err);
      setMember(null);
      setMess(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    let loadingTimeout;

    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...');
        
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

    // Set timeout for loading
    loadingTimeout = setTimeout(() => {
      if (loading && mounted) {
        console.warn('⏰ Loading timeout - forcing completion');
        setLoading(false);
      }
    }, 10000); // 10 seconds max

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
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('🔄 Token refreshed');
          setUser(session.user);
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, userData) => {
    try {
      setError(null);
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
    }
  };

  const signIn = async (email, password) => {
    try {
      setError(null);
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
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      console.log('👋 Signing out...');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setMember(null);
      setMess(null);
      localStorage.clear();
      
      console.log('✅ Signed out successfully');
      return { error: null };
    } catch (err) {
      console.error('❌ Sign out error:', err);
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
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Checking if user already has a mess...');
      
      // Check for existing member
      const { data: existingMembers, error: checkError } = await supabase
        .from('members')
        .select('id, mess_id')
        .eq('user_id', user.id)
        .limit(1);

      if (checkError) {
        console.error('❌ Check error:', checkError);
      } else if (existingMembers && existingMembers.length > 0) {
        console.log('⚠️ User already has a mess! Reloading...');
        await loadMemberData(user.id);
        throw new Error('You already have a mess!');
      }

      const memberName = userName || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'User';
      
      const memberPhone = user.user_metadata?.phone || '';
      const memberCountryCode = user.user_metadata?.country_code || '+880';
      
      console.log('📝 Creating mess:', messName);
      
      const params = {
        p_mess_name: messName.trim(),
        p_user_id: user.id,
        p_name: memberName.trim(),
        p_email: user.email.trim(),
        p_phone: memberPhone,
        p_country_code: memberCountryCode
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
      
      // If already member, reload data
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

  const reloadMemberData = async () => {
    if (user) {
      console.log('🔄 Manually reloading member data...');
      setLoading(true);
      await loadMemberData(user.id);
      setLoading(false);
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
