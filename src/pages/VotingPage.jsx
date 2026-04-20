// ============================================================
// src/pages/VotingPage.jsx
//
// Monthly manager election.
//  - Shows current voting period (YYYY-MM)
//  - Each member can cast one vote for any other member
//  - Can retract and re-vote any time in the same period
//  - Live tally with vote bars
//  - Announces the winner (most votes)
//  - If current manager is not the winner → shows a nudge
// ============================================================
import React, { useState } from 'react';
import {
  Vote, ChevronLeft, ChevronRight, Check,
  Trophy, AlertCircle, RefreshCw, Users,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMembers } from '../hooks/useMess';
import {
  useVotes, useCastVote, useRetractVote, currentPeriod,
} from '../hooks/useRulesAndVoting';
import { Alert, Spinner, Empty } from '../components/ui';

// ── Period label ──────────────────────────────────────────────
const periodLabel = (ym) =>
  new Date(`${ym}-15`).toLocaleString('en-US', { month: 'long', year: 'numeric' });

// ── Period shift ──────────────────────────────────────────────
function shiftPeriod(ym, dir) {
  const d = new Date(`${ym}-15`);
  d.setMonth(d.getMonth() + dir);
  return d.toISOString().slice(0, 7);
}

// ── Candidate row ─────────────────────────────────────────────
function CandidateRow({
  candidate, voteCount, totalVotes, isWinner,
  hasMyVote, isMe, isCurrent, onVote, onRetract,
  casting, retracting, disabled,
}) {
  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  return (
    <div className={`group relative card-sm overflow-hidden transition-all ${
      isWinner ? 'border-brand-500/30 bg-brand-500/5' : 'border-white/[0.07]'
    }`}>
      {/* Winner ribbon */}
      {isWinner && totalVotes > 0 && (
        <div className="absolute top-0 right-0 px-2 py-0.5 bg-brand-500/20 border-b border-l border-brand-500/30 rounded-bl-lg">
          <span className="text-brand-400 text-[10px] font-display font-bold flex items-center gap-1">
            <Trophy className="w-2.5 h-2.5" /> Leading
          </span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
            isWinner && totalVotes > 0
              ? 'bg-brand-500/20 border-brand-500/30'
              : 'bg-white/5 border-white/10'
          }`}>
            <span className={`font-display font-bold text-sm ${
              isWinner && totalVotes > 0 ? 'text-brand-400' : 'text-white/50'
            }`}>
              {candidate.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-semibold text-sm text-white/90 truncate">
                {candidate.name}
              </p>
              {isMe && (
                <span className="badge bg-white/5 text-white/30 border border-white/10 text-[10px]">You</span>
              )}
              {isCurrent && (
                <span className="badge badge-amber text-[10px]">
                  <ShieldCheck className="w-2.5 h-2.5" /> Current Manager
                </span>
              )}
            </div>
            <p className="text-white/30 text-xs capitalize mt-0.5">{candidate.role}</p>
          </div>

          {/* Vote count */}
          <div className="text-right shrink-0">
            <p className={`font-display font-bold text-lg leading-none ${
              isWinner && totalVotes > 0 ? 'text-brand-400' : 'text-white/50'
            }`}>
              {voteCount}
            </p>
            <p className="text-white/25 text-[10px]">
              {pct}%
            </p>
          </div>
        </div>

        {/* Vote bar */}
        <div className="h-1.5 rounded-full bg-white/[0.06] mb-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isWinner && totalVotes > 0 ? 'bg-brand-500' : 'bg-white/20'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Vote / retract button — not shown for self */}
        {!isMe && (
          hasMyVote ? (
            <button
              onClick={onRetract}
              disabled={retracting || disabled}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-display font-medium hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all group/btn disabled:opacity-50"
            >
              {retracting
                ? <Spinner />
                : <><Check className="w-3.5 h-3.5" /> <span className="group-hover/btn:hidden">Voted</span><span className="hidden group-hover/btn:inline">Retract Vote</span></>
              }
            </button>
          ) : (
            <button
              onClick={onVote}
              disabled={casting || disabled}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-body hover:bg-brand-500/10 hover:border-brand-500/20 hover:text-brand-400 transition-all disabled:opacity-50"
            >
              {casting ? <Spinner /> : <><Vote className="w-3.5 h-3.5" /> Vote</>}
            </button>
          )
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function VotingPage() {
  const { member: currentMember, mess } = useAuthStore();
  const [period, setPeriod] = useState(currentPeriod());
  const [error,  setError]  = useState('');

  const isPast    = period < currentPeriod();
  const isCurrent = period === currentPeriod();

  const { data: members = [], isLoading: mLoading } = useMembers();
  const { data: votes   = [], isLoading: vLoading, refetch } = useVotes(period);
  const castVote    = useCastVote();
  const retractVote = useRetractVote();

  const isLoading = mLoading || vLoading;

  // Tally votes per candidate
  const tally = {};
  for (const v of votes) {
    tally[v.candidate_id] = (tally[v.candidate_id] ?? 0) + 1;
  }

  const totalVotes = votes.length;

  // Find the current user's vote this period
  const myVote = votes.find((v) => v.voter_id === currentMember?.id);

  // Determine winner (highest votes; ties → alphabetical by name)
  const sortedMembers = [...members].sort((a, b) => {
    const diff = (tally[b.id] ?? 0) - (tally[a.id] ?? 0);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
  const winnerCount = tally[sortedMembers[0]?.id] ?? 0;
  const winnerId = winnerCount > 0 ? sortedMembers[0]?.id : null;

  // Current manager
  const currentManager = members.find((m) => m.role === 'manager');

  const handleVote = async (candidateId) => {
    if (!isCurrent) return;
    setError('');
    try {
      await castVote.mutateAsync({ candidateId, period });
    } catch (err) {
      setError(err.message || 'Failed to cast vote');
    }
  };

  const handleRetract = async () => {
    if (!myVote || !isCurrent) return;
    setError('');
    try {
      await retractVote.mutateAsync({ voteId: myVote.id, period });
    } catch (err) {
      setError(err.message || 'Failed to retract vote');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in max-w-2xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Manager Voting</h1>
          <p className="text-white/40 text-sm mt-0.5">
            Vote for who should manage the mess this month.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period navigator */}
          <button onClick={() => setPeriod((p) => shiftPeriod(p, -1))} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-display font-semibold text-white text-sm min-w-[136px] text-center">
            {periodLabel(period)}
          </span>
          <button onClick={() => setPeriod((p) => shiftPeriod(p, 1))} disabled={isCurrent} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => refetch()} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/40 hover:text-white transition">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Past period notice */}
      {isPast && (
        <div className="alert-info text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>This is a past period. Results are read-only.</span>
        </div>
      )}

      {/* Current period status */}
      {isCurrent && (
        <div className="card p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Vote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-white text-sm">Voting is open</p>
            <p className="text-white/35 text-xs">
              {totalVotes} of {members.length} member{members.length !== 1 ? 's' : ''} voted ·{' '}
              {myVote ? 'You have voted' : 'You haven\'t voted yet'}
            </p>
          </div>
          {myVote && (
            <span className="badge badge-green text-[10px]">
              <Check className="w-2.5 h-2.5" /> Voted
            </span>
          )}
        </div>
      )}

      {/* Winner announcement (past periods or if all have voted) */}
      {winnerId && (!isCurrent || totalVotes === members.length) && (
        <div className="card p-5 border-brand-500/25 bg-brand-500/5 text-center">
          <Trophy className="w-7 h-7 text-brand-400 mx-auto mb-2" />
          <p className="font-display font-bold text-white text-lg">
            {members.find((m) => m.id === winnerId)?.name}
          </p>
          <p className="text-white/40 text-sm mt-1">
            {isCurrent ? 'Leading with' : 'Won with'} {winnerCount} vote{winnerCount !== 1 ? 's' : ''}
            {' '}({totalVotes} total)
          </p>
          {isCurrent && winnerId !== currentManager?.id && (
            <p className="text-brand-400/70 text-xs mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Differs from current manager — update roles in Members when the period ends.
            </p>
          )}
        </div>
      )}

      {/* ── Candidate list ── */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="md" /></div>
      ) : members.length < 2 ? (
        <Empty
          icon={Users}
          title="Need at least 2 members"
          description="Voting requires at least 2 active members in the mess."
        />
      ) : (
        <div className="space-y-3">
          {sortedMembers.map((m) => (
            <CandidateRow
              key={m.id}
              candidate={m}
              voteCount={tally[m.id] ?? 0}
              totalVotes={totalVotes}
              isWinner={m.id === winnerId}
              hasMyVote={myVote?.candidate_id === m.id}
              isMe={m.id === currentMember?.id}
              isCurrent={m.id === currentManager?.id}
              onVote={() => handleVote(m.id)}
              onRetract={handleRetract}
              casting={castVote.isPending}
              retracting={retractVote.isPending}
              disabled={isPast}
            />
          ))}
        </div>
      )}

      {/* Rules */}
      <div className="card p-4">
        <h3 className="font-display font-semibold text-white/60 text-xs uppercase tracking-wider mb-3">Voting Rules</h3>
        <ul className="space-y-1.5">
          {[
            'You can vote for any member except yourself.',
            'You can change or retract your vote any time within the current month.',
            'The member with the most votes at month end becomes the suggested manager.',
            'Ties are broken alphabetically. Roles must be updated manually in the Members section.',
            'Past voting periods are read-only.',
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-white/35">
              <span className="text-brand-500/60 font-display font-bold shrink-0">{i + 1}.</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
