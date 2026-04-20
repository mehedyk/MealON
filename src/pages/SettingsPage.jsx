// ============================================================
// src/pages/SettingsPage.jsx
// ============================================================
import React, { useState } from 'react';
import { Settings, Save, LogOut, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Alert, Field, Spinner } from '../components/ui';
import { validateName } from '../utils/validate';

export default function SettingsPage() {
  const { user, member, mess, signOut, refreshMess } = useAuthStore();
  const navigate = useNavigate();
  const isManager = member?.role === 'manager';

  // ── Rename mess ────────────────────────────────────────────
  const [messName, setMessName]         = useState(mess?.name || '');
  const [nameError, setNameError]       = useState('');
  const [renameMsg, setRenameMsg]       = useState('');
  const [renaming, setRenaming]         = useState(false);

  const handleRename = async (ev) => {
    ev.preventDefault();
    setRenameMsg('');
    const v = validateName(messName, { label: 'Mess name', min: 2, max: 80 });
    if (!v.ok) { setNameError(v.message); return; }
    setNameError('');
    setRenaming(true);
    try {
      const { error } = await supabase
        .from('mess')
        .update({ name: v.value })
        .eq('id', mess.id);
      if (error) throw error;
      await refreshMess();
      setRenameMsg('Mess name updated successfully.');
    } catch (err) {
      setRenameMsg('Error: ' + (err.message || 'Failed to update'));
    } finally {
      setRenaming(false);
    }
  };

  // ── Leave mess ─────────────────────────────────────────────
  const [leaveConfirmText, setLeaveConfirmText] = useState('');
  const [leaveError, setLeaveError]             = useState('');
  const [leaving, setLeaving]                   = useState(false);
  const LEAVE_CONFIRM = 'LEAVE';

  const handleLeave = async () => {
    if (leaveConfirmText !== LEAVE_CONFIRM) {
      setLeaveError(`Type "${LEAVE_CONFIRM}" to confirm`);
      return;
    }
    setLeaveError('');
    setLeaving(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_active: false })
        .eq('id', member.id);
      if (error) throw error;
      await signOut();
      navigate('/auth', { replace: true });
    } catch (err) {
      setLeaveError(err.message || 'Failed to leave mess');
      setLeaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-0.5">Manage your mess and account settings.</p>
      </div>

      {/* ── Account info ── */}
      <div className="card p-5 space-y-3">
        <h2 className="font-display font-semibold text-white text-sm mb-3">Your Account</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: 'Name',  value: member?.name },
            { label: 'Email', value: user?.email },
            { label: 'Role',  value: <span className="capitalize">{member?.role}</span> },
            { label: 'Mess',  value: mess?.name },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-white/30 text-xs mb-0.5">{label}</p>
              <p className="text-white/80 text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rename mess (manager only) ── */}
      {isManager && (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-white text-sm mb-1">Rename Mess</h2>
          <p className="text-white/35 text-xs mb-4">Change the display name of your mess. The mess code stays the same.</p>

          {renameMsg && (
            <Alert type={renameMsg.startsWith('Error') ? 'error' : 'success'} className="mb-4">
              {renameMsg}
            </Alert>
          )}

          <form onSubmit={handleRename} noValidate className="flex gap-3">
            <Field error={nameError} className="flex-1">
              <input
                type="text"
                className={`input ${nameError ? 'input-error' : ''}`}
                value={messName}
                onChange={(e) => setMessName(e.target.value)}
                maxLength={80}
                placeholder="New mess name"
              />
            </Field>
            <button type="submit" disabled={renaming} className="btn-primary shrink-0">
              {renaming ? <Spinner /> : <><Save className="w-4 h-4" /> Save</>}
            </button>
          </form>
        </div>
      )}

      {/* ── Danger zone ── */}
      <div className="card p-5 border-red-500/15">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <h2 className="font-display font-semibold text-red-400 text-sm">Danger Zone</h2>
        </div>
        <p className="text-white/35 text-xs mb-5 leading-relaxed">
          Leaving the mess is permanent. Your meal and expense records will remain, but you'll lose access to this mess.
          {isManager && ' As manager, make sure another manager is assigned before leaving.'}
        </p>

        {leaveError && <Alert type="error" className="mb-4">{leaveError}</Alert>}

        <div className="space-y-3">
          <div>
            <p className="text-xs text-white/40 mb-2">
              Type <span className="font-display font-bold text-red-400">{LEAVE_CONFIRM}</span> to confirm
            </p>
            <input
              type="text"
              className={`input w-full sm:w-64 ${leaveConfirmText && leaveConfirmText !== LEAVE_CONFIRM ? 'input-error' : ''}`}
              placeholder={LEAVE_CONFIRM}
              value={leaveConfirmText}
              onChange={(e) => setLeaveConfirmText(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>
          <button
            onClick={handleLeave}
            disabled={leaving || leaveConfirmText !== LEAVE_CONFIRM}
            className="btn-danger"
          >
            {leaving ? <Spinner /> : <><LogOut className="w-4 h-4" /> Leave this Mess</>}
          </button>
        </div>
      </div>
    </div>
  );
}
