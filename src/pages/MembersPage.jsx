// ============================================================
// src/pages/MembersPage.jsx
// Manager: can promote/demote and remove members.
// All: can see the member list and mess code to share.
// ============================================================
import React, { useState } from 'react';
import {
  Users, Copy, Check, Shield, UserX, ChevronDown,
  AlertTriangle, X, Phone, Mail, Calendar,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMembers, useUpdateMemberRole, useRemoveMember } from '../hooks/useMess';
import { Spinner, Alert, Empty } from '../components/ui';

// ── Confirm modal ─────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card p-6 w-full max-w-sm animate-fade-up">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${danger ? 'bg-red-500/10' : 'bg-brand-500/10'}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-brand-400'}`} />
        </div>
        <h3 className="font-display font-bold text-white mb-2">{title}</h3>
        <p className="text-white/50 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading} className="btn-ghost flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-medium transition-all disabled:opacity-50 ${
              danger
                ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20'
                : 'btn-primary'
            }`}
          >
            {loading ? <Spinner /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Member row ────────────────────────────────────────────────
function MemberRow({ m, isCurrentUser, isManager, onRoleChange, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const joinDate = new Date(m.joined_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-white/[0.02] transition group">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0">
        <span className="text-brand-400 text-sm font-display font-bold">
          {m.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-white/90 truncate">{m.name}</p>
          {isCurrentUser && (
            <span className="badge bg-white/5 text-white/30 border border-white/10 text-[10px]">You</span>
          )}
          <span className={`badge text-[10px] ${m.role === 'manager' ? 'badge-amber' : 'badge-blue'}`}>
            {m.role === 'manager' ? '★ Manager' : 'Member'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-white/30">
            <Mail className="w-3 h-3" /> {m.email}
          </span>
          {m.phone && (
            <span className="flex items-center gap-1 text-xs text-white/30">
              <Phone className="w-3 h-3" /> {m.phone}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-white/25">
            <Calendar className="w-3 h-3" /> Joined {joinDate}
          </span>
        </div>
      </div>

      {/* Manager actions — only shown to manager, not on their own row */}
      {isManager && !isCurrentUser && (
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-2 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/5 transition opacity-0 group-hover:opacity-100"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 card-sm py-1 w-44 shadow-xl shadow-black/40">
                <button
                  onClick={() => { onRoleChange(m.id, m.role === 'manager' ? 'member' : 'manager'); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition text-left"
                >
                  <Shield className="w-3.5 h-3.5" />
                  {m.role === 'manager' ? 'Demote to Member' : 'Promote to Manager'}
                </button>
                <div className="h-px bg-white/[0.06] my-1" />
                <button
                  onClick={() => { onRemove(m); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition text-left"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Remove from Mess
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function MembersPage() {
  const { member: currentMember, mess } = useAuthStore();
  const isManager = currentMember?.role === 'manager';

  const { data: members = [], isLoading, error, refetch } = useMembers();
  const updateRole = useUpdateMemberRole();
  const removeMutation = useRemoveMember();

  const [codeCopied, setCodeCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null); // member object
  const [confirmRole, setConfirmRole]     = useState(null); // { id, newRole, name }
  const [actionError, setActionError]     = useState('');

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(mess?.mess_code || '');
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {}
  };

  const handleRoleChange = (memberId, newRole) => {
    const m = members.find((x) => x.id === memberId);
    setConfirmRole({ id: memberId, newRole, name: m?.name });
  };

  const handleRemove = (m) => {
    setConfirmRemove(m);
  };

  const confirmRoleChange = async () => {
    setActionError('');
    try {
      await updateRole.mutateAsync({ memberId: confirmRole.id, role: confirmRole.newRole });
      setConfirmRole(null);
    } catch (err) {
      setActionError(err.message || 'Failed to update role');
    }
  };

  const confirmRemoveAction = async () => {
    setActionError('');
    try {
      await removeMutation.mutateAsync(confirmRemove.id);
      setConfirmRemove(null);
    } catch (err) {
      setActionError(err.message || 'Failed to remove member');
    }
  };

  const managerCount = members.filter((m) => m.role === 'manager').length;

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Members</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {isLoading ? '…' : `${members.length} active member${members.length !== 1 ? 's' : ''}`} in {mess?.name}
          </p>
        </div>
      </div>

      {actionError && (
        <Alert type="error">{actionError}</Alert>
      )}

      {/* ── Invite card ── */}
      <div className="card p-5 border-brand-500/15 bg-brand-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-white mb-1">
              Invite someone to this mess
            </h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Share the 6-character code below. They sign up (or log in) and enter it on the onboarding screen.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-surface-800 border border-brand-500/20">
              <p className="text-[10px] text-white/30 font-body mb-0.5 text-center">Mess Code</p>
              <p className="font-display font-bold text-brand-400 tracking-[0.35em] text-xl text-center">
                {mess?.mess_code}
              </p>
            </div>
            <button
              onClick={copyCode}
              className={`p-3 rounded-xl border transition-all ${
                codeCopied
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-surface-800 border-white/10 text-white/50 hover:text-white hover:border-white/20'
              }`}
              title="Copy code"
            >
              {codeCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Members list ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/[0.05]">
          <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" />
            Active Members
          </h2>
          {isLoading && <Spinner />}
        </div>

        {error ? (
          <div className="p-5">
            <Alert type="error">
              Failed to load members.{' '}
              <button onClick={() => refetch()} className="underline">Retry</button>
            </Alert>
          </div>
        ) : members.length === 0 && !isLoading ? (
          <Empty icon={Users} title="No members yet" description="Share the mess code to invite people." />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                m={m}
                isCurrentUser={m.id === currentMember?.id}
                isManager={isManager}
                onRoleChange={handleRoleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Manager info */}
      {isManager && members.length > 0 && (
        <p className="text-white/25 text-xs text-center">
          Hover a member row to see management options. At least one manager must remain.
        </p>
      )}

      {/* ── Confirm role change modal ── */}
      {confirmRole && (
        <ConfirmModal
          title={`${confirmRole.newRole === 'manager' ? 'Promote' : 'Demote'} ${confirmRole.name}?`}
          message={
            confirmRole.newRole === 'manager'
              ? `${confirmRole.name} will become a manager and can add expenses, manage members, and change mess settings.`
              : `${confirmRole.name} will be demoted to a regular member. ${managerCount <= 1 ? 'Note: you are the only manager — make sure someone else is promoted first.' : ''}`
          }
          confirmLabel={confirmRole.newRole === 'manager' ? 'Promote' : 'Demote'}
          danger={confirmRole.newRole === 'member'}
          onConfirm={confirmRoleChange}
          onCancel={() => setConfirmRole(null)}
          loading={updateRole.isPending}
        />
      )}

      {/* ── Confirm remove modal ── */}
      {confirmRemove && (
        <ConfirmModal
          title={`Remove ${confirmRemove.name}?`}
          message={`${confirmRemove.name} will lose access to this mess. Their meal and expense history will remain in the records. This cannot be undone without them re-joining.`}
          confirmLabel="Remove Member"
          danger
          onConfirm={confirmRemoveAction}
          onCancel={() => setConfirmRemove(null)}
          loading={removeMutation.isPending}
        />
      )}
    </div>
  );
}
