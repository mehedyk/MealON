// ============================================================
// src/hooks/useMembers.js
// TanStack Query hook for mess members.
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const MEMBERS_KEY = (messId) => ['members', messId];

export function useMembers() {
  const { mess } = useAuthStore();
  const messId = mess?.id;

  return useQuery({
    queryKey: MEMBERS_KEY(messId),
    enabled: !!messId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('mess_id', messId)
        .order('joined_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30,
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  const { mess, member: self } = useAuthStore();

  return useMutation({
    mutationFn: async ({ memberId, role }) => {
      // Only managers can change roles
      if (self?.role !== 'manager') throw new Error('Only the manager can change roles.');
      // Can't demote yourself if you're the only manager
      if (memberId === self.id && role === 'member') {
        // Check if there's another manager
        const { data } = await supabase
          .from('members')
          .select('id')
          .eq('mess_id', mess.id)
          .eq('role', 'manager')
          .eq('is_active', true);
        if ((data?.length || 0) <= 1) {
          throw new Error('You are the only manager. Assign another manager before demoting yourself.');
        }
      }
      const { error } = await supabase
        .from('members')
        .update({ role })
        .eq('id', memberId)
        .eq('mess_id', mess.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBERS_KEY(mess?.id) }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  const { mess, member: self } = useAuthStore();

  return useMutation({
    mutationFn: async (memberId) => {
      if (self?.role !== 'manager') throw new Error('Only the manager can remove members.');
      if (memberId === self.id) throw new Error('You cannot remove yourself. Transfer manager role first.');
      const { error } = await supabase
        .from('members')
        .update({ is_active: false })
        .eq('id', memberId)
        .eq('mess_id', mess.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: MEMBERS_KEY(mess?.id) }),
  });
}
