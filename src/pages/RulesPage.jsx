// ============================================================
// src/pages/RulesPage.jsx
// Manager: add, activate/deactivate, delete rules.
// All members: read-only view.
// ============================================================
import React, { useState } from 'react';
import {
  BookOpen, Plus, Power, Trash2, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  useRules, useAddRule, useToggleRule, useDeleteRule,
} from '../hooks/useRulesAndVoting';
import { Alert, Spinner, Empty, Field } from '../components/ui';
import { validateName, validateDescription, sanitizeText } from '../utils/validate';

// ── Confirm inline delete ─────────────────────────────────────
function DeleteRuleBtn({ onConfirm, loading }) {
  const [armed, setArmed] = useState(false);
  if (armed) return (
    <div className="flex items-center gap-1">
      <button onClick={() => setArmed(false)} className="text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded transition">Cancel</button>
      <button onClick={onConfirm} disabled={loading} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 transition flex items-center gap-1">
        {loading ? <Spinner /> : <><Trash2 className="w-3 h-3" />Delete</>}
      </button>
    </div>
  );
  return (
    <button onClick={() => setArmed(true)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/8 transition opacity-0 group-hover:opacity-100">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

// ── Rule card ─────────────────────────────────────────────────
function RuleCard({ rule, isManager, onToggle, onDelete, toggling, deleting }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`group card-sm overflow-hidden transition-all ${
      rule.is_active ? 'border-white/[0.07]' : 'border-white/[0.03] opacity-60'
    }`}>
      <div className="flex items-start gap-3 p-4">
        {/* Active indicator dot */}
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
          rule.is_active ? 'bg-emerald-400' : 'bg-white/20'
        }`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 justify-between">
            <h3 className={`font-display font-semibold text-sm leading-snug ${
              rule.is_active ? 'text-white' : 'text-white/40'
            }`}>
              {rule.title}
            </h3>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-white/25 hover:text-white/60 transition shrink-0 mt-0.5"
            >
              {expanded
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />
              }
            </button>
          </div>

          {/* Description — collapsed to 2 lines by default */}
          <p className={`text-xs text-white/45 mt-1.5 leading-relaxed ${
            expanded ? '' : 'line-clamp-2'
          }`}>
            {rule.description}
          </p>

          {/* Meta */}
          <p className="text-white/20 text-[10px] mt-2">
            Added by {rule.creator?.name} ·{' '}
            {new Date(rule.created_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        </div>

        {/* Manager actions */}
        {isManager && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Toggle active */}
            <button
              onClick={() => onToggle({ id: rule.id, is_active: !rule.is_active })}
              disabled={toggling}
              title={rule.is_active ? 'Deactivate' : 'Activate'}
              className={`p-1.5 rounded-lg border transition-all opacity-0 group-hover:opacity-100 ${
                rule.is_active
                  ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/8 hover:bg-emerald-500/20'
                  : 'text-white/30 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white/60'
              }`}
            >
              {toggling ? <Spinner /> : <Power className="w-3.5 h-3.5" />}
            </button>
            <DeleteRuleBtn onConfirm={() => onDelete(rule.id)} loading={deleting} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add rule form ─────────────────────────────────────────────
function AddRuleForm({ onClose }) {
  const [title, setTitle]       = useState('');
  const [desc,  setDesc]        = useState('');
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const addRule = useAddRule();

  const validate = () => {
    const e = {};
    const t = validateName(title, { label: 'Title', min: 2, max: 120 });
    if (!t.ok) e.title = t.message;
    const d = validateDescription(desc, { label: 'Description', max: 1000 });
    if (!d.ok) e.desc = d.message;
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setApiError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await addRule.mutateAsync({
        title:       sanitizeText(title),
        description: sanitizeText(desc),
      });
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to add rule');
    }
  };

  return (
    <div className="card p-5 border-brand-500/20 bg-brand-500/5">
      <h3 className="font-display font-semibold text-white text-sm mb-4">Add New Rule</h3>
      {apiError && <Alert type="error" className="mb-4">{apiError}</Alert>}
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <Field label="Rule Title" error={errors.title}>
          <input
            type="text"
            className={`input ${errors.title ? 'input-error' : ''}`}
            placeholder="e.g. No guests after 11pm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            autoFocus
          />
          <p className="text-white/20 text-[10px] mt-1">{title.length}/120</p>
        </Field>
        <Field label="Description" error={errors.desc}>
          <textarea
            className={`input min-h-[80px] resize-y ${errors.desc ? 'input-error' : ''}`}
            placeholder="Describe the rule in detail so members understand it clearly…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={1000}
          />
          <p className="text-white/20 text-[10px] mt-1">{desc.length}/1000</p>
        </Field>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={addRule.isPending} className="btn-primary">
            {addRule.isPending ? <><Spinner />Adding…</> : <><Plus className="w-4 h-4" />Add Rule</>}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function RulesPage() {
  const { member } = useAuthStore();
  const isManager = member?.role === 'manager';

  const { data: rules = [], isLoading, error, refetch } = useRules();
  const toggleRule = useToggleRule();
  const deleteRule = useDeleteRule();

  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState('');

  const active   = rules.filter((r) => r.is_active);
  const inactive = rules.filter((r) => !r.is_active);

  const handleToggle = async (args) => {
    setActionError('');
    try { await toggleRule.mutateAsync(args); }
    catch (err) { setActionError(err.message || 'Failed to update rule'); }
  };

  const handleDelete = async (id) => {
    setActionError('');
    try { await deleteRule.mutateAsync(id); }
    catch (err) { setActionError(err.message || 'Failed to delete rule'); }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in max-w-2xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Rules</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {active.length} active rule{active.length !== 1 ? 's' : ''}
            {inactive.length > 0 && ` · ${inactive.length} inactive`}
          </p>
        </div>
        {isManager && !showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        )}
      </div>

      {actionError && <Alert type="error">{actionError}</Alert>}
      {error && <Alert type="error">Failed to load rules. <button onClick={() => refetch()} className="underline">Retry</button></Alert>}

      {/* Add form */}
      {showForm && <AddRuleForm onClose={() => setShowForm(false)} />}

      {/* Rules list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="md" /></div>
      ) : rules.length === 0 ? (
        <Empty
          icon={BookOpen}
          title="No rules yet"
          description={isManager ? 'Add the first rule for your mess.' : 'Your manager hasn\'t added any rules yet.'}
          action={isManager && !showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" /> Add First Rule
            </button>
          )}
        />
      ) : (
        <div className="space-y-2.5">
          {/* Active rules */}
          {active.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              isManager={isManager}
              onToggle={handleToggle}
              onDelete={handleDelete}
              toggling={toggleRule.isPending}
              deleting={deleteRule.isPending}
            />
          ))}

          {/* Inactive rules section */}
          {inactive.length > 0 && (
            <div className="pt-2">
              <p className="text-white/20 text-xs font-display uppercase tracking-widest mb-2.5 px-1">
                Inactive / Archived
              </p>
              <div className="space-y-2">
                {inactive.map((rule) => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    isManager={isManager}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    toggling={toggleRule.isPending}
                    deleting={deleteRule.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info for members */}
      {!isManager && rules.length > 0 && (
        <p className="text-white/20 text-xs text-center">
          Rules are set by the manager. Contact them if you have concerns.
        </p>
      )}
    </div>
  );
}
