// src/store/authStore.js
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user:        null,
  member:      null,
  mess:        null,
  loading:     true,
  initialized: false,

  setUser:    (user)    => set({ user }),
  setMember:  (member)  => set({ member }),
  setMess:    (mess)    => set({ mess }),
  setLoading: (loading) => set({ loading }),

  loadMemberAndMess: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*, mess:mess_id(*)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const { mess: messData, ...memberOnly } = data;
        set({ member: memberOnly, mess: messData });
      } else {
        set({ member: null, mess: null });
      }
    } catch {
      set({ member: null, mess: null });
    }
  },

  initialize: async () => {
    if (get().initialized) return;
    set({ initialized: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user });
        await get().loadMemberAndMess(session.user.id);
      }
    } catch {
      // session fetch failed — user stays unauthenticated
    } finally {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({ user: session.user });
        await get().loadMemberAndMess(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, member: null, mess: null });
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        set({ user: session.user });
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, member: null, mess: null });
  },

  refreshMess: async () => {
    const { user } = get();
    if (user) await get().loadMemberAndMess(user.id);
  },
}));
