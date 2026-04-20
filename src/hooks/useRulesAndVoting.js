// ============================================================
// src/hooks/useRulesAndVoting.js
// TanStack Query hooks for Rules and Voting modules.
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ── Keys ─────────────────────────────────────────────────────
export const RV_KEYS = {
  rules:  (messId)     => ['rules',  messId],
  votes:  (messId, ym) => ['votes',  messId, ym],
};

// ── Current voting period (YYYY-MM) ──────────────────────────
export const currentPeriod = () => new Date().toISOString().slice(0, 7);

// ── useRules ─────────────────────────────────────────────────
export function useRules() {
  const { mess } = useAuthStore();
  return useQuery({
    queryKey: RV_KEYS.rules(mess?.id),
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('rules')
        .select('*, creator:created_by(name)')
        .eq('mess_id', mess.id)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── useAddRule ────────────────────────────────────────────────
export function useAddRule() {
  const qc = useQueryClient();
  const { mess, member } = useAuthStore();
  return useMutation({
    mutationFn: async ({ title, description }) => {
      const { data, error } = await supabase
        .from('rules')
        .insert({
          mess_id:    mess.id,
          title:      title.trim(),
          description: description.trim(),
          created_by: member.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RV_KEYS.rules(mess?.id) }),
  });
}

// ── useToggleRule — activate / deactivate ────────────────────
export function useToggleRule() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();
  return useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from('rules')
        .update({ is_active })
        .eq('id', id)
        .eq('mess_id', mess.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RV_KEYS.rules(mess?.id) }),
  });
}

// ── useDeleteRule ─────────────────────────────────────────────
export function useDeleteRule() {
  const qc = useQueryClient();
  const { mess } = useAuthStore();
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', id)
        .eq('mess_id', mess.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: RV_KEYS.rules(mess?.id) }),
  });
}

// ── useVotes: all votes for a period ─────────────────────────
export function useVotes(period) {
  const { mess } = useAuthStore();
  return useQuery({
    queryKey: RV_KEYS.votes(mess?.id, period),
    enabled:  !!mess?.id,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('id, voter_id, candidate_id')
        .eq('mess_id', mess.id)
        .eq('voting_period', period);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── useCastVote ───────────────────────────────────────────────
export function useCastVote() {
  const qc = useQueryClient();
  const { mess, member } = useAuthStore();
  return useMutation({
    mutationFn: async ({ candidateId, period }) => {
      // Upsert: if voter already voted this period, replace their vote
      const { error } = await supabase
        .from('votes')
        .upsert(
          {
            mess_id:        mess.id,
            voter_id:       member.id,
            candidate_id:   candidateId,
            voting_period:  period,
          },
          { onConflict: 'voter_id,mess_id,voting_period' }
        );
      if (error) throw error;
    },
    onSuccess: (_, { period }) => {
      qc.invalidateQueries({ queryKey: RV_KEYS.votes(mess?.id, period) });
    },
  });
}

// ── useRetractVote ────────────────────────────────────────────
export function useRetractVote() {
  const qc = useQueryClient();
  const { mess, member } = useAuthStore();
  return useMutation({
    mutationFn: async ({ voteId, period }) => {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('id', voteId)
        .eq('voter_id', member.id)   // RLS also enforces this
        .eq('mess_id', mess.id);
      if (error) throw error;
      return period;
    },
    onSuccess: (period) => {
      qc.invalidateQueries({ queryKey: RV_KEYS.votes(mess?.id, period) });
    },
  });
}
