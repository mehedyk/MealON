// ============================================================
// src/pages/ExpensesPage.jsx
//
// Three tabs:
//   1. Expenses — add / list / delete shared expenses
//   2. Deposits  — manager adds member deposits (cash put in)
//   3. Balance   — per-member balance sheet + settlement summary
// ============================================================
import React, { useState } from 'react';
import {
  Wallet, PiggyBank, BarChart2,
  Plus, Trash2, AlertTriangle, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Minus, RefreshCw, Info,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMembers } from '../hooks/useMess';
import {
  useExpenses, useDeposits, useBalanceSheet,
  useAddExpense, useDeleteExpense,
  useAddDeposit, useDeleteDeposit,
  lastOfMonth,
} from '../hooks/useExpenses';
import { Alert, Spinner, Empty, Field } from '../components/ui';
import {
  parseAmount, validateDate, validateDescription,
  sanitizeText,
} from '../utils/validate';

// ── Constants ─────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'grocery',     label: 'Grocery',     emoji: '🛒' },
  { value: 'utility',     label: 'Utility',     emoji: '💡' },
  { value: 'maintenance', label: 'Maintenance', emoji: '🔧' },
  { value: 'cook',        label: 'Cook/Labour', emoji: '👨‍🍳' },
  { value: 'other',       label: 'Other',       emoji: '📦' },
];

const CAT_BADGE = {
  grocery:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  utility:     'bg-blue-500/10    text-blue-400    border-blue-500/20',
  maintenance: 'bg-amber-500/10   text-amber-400   border-amber-500/20',
  cook:        'bg-purple-500/10  text-purple-400  border-purple-500/20',
  other:       'bg-white/5        text-white/40    border-white/10',
};

const TABS = [
  { id: 'expenses', label: 'Expenses', icon: Wallet },
  { id: 'deposits', label: 'Deposits', icon: PiggyBank },
  { id: 'balance',  label: 'Balance',  icon: BarChart2 },
];

// ── Month navigator ───────────────────────────────────────────
function MonthNav({ yearMonth, onChange }) {
  const label = new Date(`${yearMonth}-15`).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth = yearMonth === new Date().toISOString().slice(0, 7);

  const shift = (dir) => {
    const d = new Date(`${yearMonth}-15`);
    d.setMonth(d.getMonth() + dir);
    const nm = d.toISOString().slice(0, 7);
    if (dir > 0 && nm > new Date().toISOString().slice(0, 7)) return;
    onChange(nm);
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => shift(-1)} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white transition">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="font-display font-semibold text-white text-sm min-w-[140px] text-center">{label}</span>
      <button onClick={() => shift(1)} disabled={isCurrentMonth} className="p-2 rounded-xl bg-surface-800 border border-white/[0.07] text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Delete confirm inline ─────────────────────────────────────
function DeleteBtn({ onConfirm, loading }) {
  const [armed, setArmed] = useState(false);
  if (armed) return (
    <div className="flex items-center gap-1">
      <button onClick={() => setArmed(false)} className="text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded transition">Cancel</button>
      <button onClick={onConfirm} disabled={loading} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 transition">
        {loading ? <Spinner /> : 'Delete'}
      </button>
    </div>
  );
  return (
    <button onClick={() => setArmed(true)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/8 transition opacity-0 group-hover:opacity-100">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

// ── ─────────────────────────────────────────────────────────────
// TAB 1: EXPENSES
// ─────────────────────────────────────────────────────────────
function ExpensesTab({ yearMonth, members, isManager, currentMember }) {
  const today = new Date().toISOString().split('T')[0];
  const maxDate = yearMonth >= today.slice(0, 7) ? today : lastOfMonth(yearMonth);
  const minDate = `${yearMonth}-01`;

  // Form state
  const [paidBy,   setPaidBy]   = useState(String(currentMember?.id || ''));
  const [desc,     setDesc]     = useState('');
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('grocery');
  const [date,     setDate]     = useState(today >= minDate && today <= maxDate ? today : maxDate);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');

  const { data: expenses = [], isLoading, refetch } = useExpenses(yearMonth);
  const addExp = useAddExpense();
  const delExp = useDeleteExpense();

  const totalMonth = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);

  const validate = () => {
    const e = {};
    const dv = validateDate(date);
    if (!dv.ok) e.date = dv.message;
    if (date < minDate || date > maxDate) e.date = 'Date must be within the selected month';
    const av = parseAmount(amount);
    if (!av.ok) e.amount = av.message;
    const dsc = validateDescription(desc, { label: 'Description', max: 300 });
    if (!dsc.ok) e.desc = dsc.message;
    if (!paidBy) e.paidBy = 'Select who paid';
    return e;
  };

  const handleAdd = async (ev) => {
    ev.preventDefault();
    setApiError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const av = parseAmount(amount);
    try {
      await addExp.mutateAsync({
        paidBy:      parseInt(paidBy, 10),
        description: sanitizeText(desc),
        amount:      av.value,
        category,
        expenseDate: date,
      });
      setDesc(''); setAmount(''); setPaidBy(String(currentMember?.id || ''));
    } catch (err) {
      setApiError(err.message || 'Failed to add expense');
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Add form ── */}
      {isManager && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white text-sm mb-4">Add Expense</h3>
          {apiError && <Alert type="error" className="mb-4">{apiError}</Alert>}
          <form onSubmit={handleAdd} noValidate>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <Field label="Description" error={errors.desc}>
                <input type="text" className={`input ${errors.desc ? 'input-error' : ''}`}
                  placeholder="e.g. Rice 5kg, Gas bill" value={desc}
                  onChange={(e) => setDesc(e.target.value)} maxLength={300} />
              </Field>
              <Field label="Amount (৳)" error={errors.amount}>
                <input type="number" className={`input ${errors.amount ? 'input-error' : ''}`}
                  placeholder="0.00" value={amount} min="0.01" step="0.01"
                  onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field label="Paid By" error={errors.paidBy}>
                <select className={`input ${errors.paidBy ? 'input-error' : ''}`}
                  value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                  <option value="">Select member…</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date" error={errors.date}>
                <input type="date" className={`input ${errors.date ? 'input-error' : ''}`}
                  value={date} min={minDate} max={maxDate}
                  onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>
            <button type="submit" disabled={addExp.isPending} className="btn-primary">
              {addExp.isPending ? <><Spinner /> Adding…</> : <><Plus className="w-4 h-4" /> Add Expense</>}
            </button>
          </form>
        </div>
      )}

      {/* ── List ── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/[0.05]">
          <h3 className="font-display font-semibold text-white text-sm">
            Expenses
            {expenses.length > 0 && (
              <span className="ml-2 text-white/30 font-body font-normal text-xs">
                {expenses.length} entries · ৳{totalMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            )}
          </h3>
          <button onClick={() => refetch()} className="p-1.5 text-white/30 hover:text-white transition rounded-lg hover:bg-white/5">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : expenses.length === 0 ? (
          <Empty icon={Wallet} title="No expenses this month" description={isManager ? 'Add your first expense above.' : 'No expenses recorded yet.'} />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {expenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 group">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/85 truncate">{exp.description}</p>
                  <p className="text-xs text-white/35 mt-0.5">
                    {exp.payer?.name} paid ·{' '}
                    {new Date(`${exp.expense_date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className={`badge text-[10px] border ${CAT_BADGE[exp.category]}`}>
                  {CATEGORIES.find((c) => c.value === exp.category)?.emoji} {exp.category}
                </span>
                <span className="font-display font-semibold text-white text-sm shrink-0">
                  ৳{parseFloat(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                {isManager && (
                  <DeleteBtn
                    onConfirm={() => delExp.mutate({ id: exp.id, expenseDate: exp.expense_date })}
                    loading={delExp.isPending}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {expenses.length > 0 && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
            <span className="text-xs text-white/40 font-display">Total</span>
            <span className="font-display font-bold text-brand-400">
              ৳{totalMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ─────────────────────────────────────────────────────────────
// TAB 2: DEPOSITS
// ─────────────────────────────────────────────────────────────
function DepositsTab({ yearMonth, members, isManager, currentMember }) {
  const today    = new Date().toISOString().split('T')[0];
  const maxDate  = yearMonth >= today.slice(0, 7) ? today : lastOfMonth(yearMonth);
  const minDate  = `${yearMonth}-01`;

  const [memberId, setMemberId] = useState(String(currentMember?.id || ''));
  const [amount,   setAmount]   = useState('');
  const [note,     setNote]     = useState('');
  const [date,     setDate]     = useState(today >= minDate && today <= maxDate ? today : maxDate);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');

  const { data: deposits = [], isLoading, refetch } = useDeposits(yearMonth);
  const addDep = useAddDeposit();
  const delDep = useDeleteDeposit();

  const totalMonth = deposits.reduce((s, d) => s + parseFloat(d.amount), 0);

  const validate = () => {
    const e = {};
    const dv = validateDate(date);
    if (!dv.ok) e.date = dv.message;
    if (date < minDate || date > maxDate) e.date = 'Date must be within the selected month';
    const av = parseAmount(amount);
    if (!av.ok) e.amount = av.message;
    if (!memberId) e.member = 'Select a member';
    return e;
  };

  const handleAdd = async (ev) => {
    ev.preventDefault();
    setApiError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const av = parseAmount(amount);
    try {
      await addDep.mutateAsync({
        memberId:    parseInt(memberId, 10),
        amount:      av.value,
        note:        note ? sanitizeText(note) : null,
        depositDate: date,
      });
      setAmount(''); setNote('');
    } catch (err) {
      setApiError(err.message || 'Failed to add deposit');
    }
  };

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="alert-info text-xs">
        <Info className="w-4 h-4 shrink-0" />
        <span>Deposits track cash members hand to the manager for mess expenses. Only managers can record deposits.</span>
      </div>

      {isManager && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white text-sm mb-4">Record Deposit</h3>
          {apiError && <Alert type="error" className="mb-4">{apiError}</Alert>}
          <form onSubmit={handleAdd} noValidate>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <Field label="Member" error={errors.member}>
                <select className={`input ${errors.member ? 'input-error' : ''}`}
                  value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                  <option value="">Select member…</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </Field>
              <Field label="Amount (৳)" error={errors.amount}>
                <input type="number" className={`input ${errors.amount ? 'input-error' : ''}`}
                  placeholder="0.00" value={amount} min="0.01" step="0.01"
                  onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field label="Note (optional)">
                <input type="text" className="input"
                  placeholder="e.g. October deposit, advance" value={note}
                  onChange={(e) => setNote(e.target.value)} maxLength={200} />
              </Field>
              <Field label="Date" error={errors.date}>
                <input type="date" className={`input ${errors.date ? 'input-error' : ''}`}
                  value={date} min={minDate} max={maxDate}
                  onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>
            <button type="submit" disabled={addDep.isPending} className="btn-primary">
              {addDep.isPending ? <><Spinner /> Recording…</> : <><Plus className="w-4 h-4" /> Record Deposit</>}
            </button>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/[0.05]">
          <h3 className="font-display font-semibold text-white text-sm">
            Deposits
            {deposits.length > 0 && (
              <span className="ml-2 text-white/30 font-body font-normal text-xs">
                ৳{totalMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })} collected
              </span>
            )}
          </h3>
          <button onClick={() => refetch()} className="p-1.5 text-white/30 hover:text-white transition rounded-lg hover:bg-white/5">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : deposits.length === 0 ? (
          <Empty icon={PiggyBank} title="No deposits this month"
            description={isManager ? 'Record member deposits above.' : 'No deposits recorded yet.'} />
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {deposits.map((dep) => (
              <div key={dep.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 group">
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 text-[10px] font-display font-bold">
                    {dep.member?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/85">{dep.member?.name}</p>
                  <p className="text-xs text-white/35 mt-0.5">
                    {new Date(`${dep.deposit_date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    {dep.note && ` · ${dep.note}`}
                  </p>
                </div>
                <span className="font-display font-semibold text-emerald-400 text-sm shrink-0">
                  +৳{parseFloat(dep.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                {isManager && (
                  <DeleteBtn
                    onConfirm={() => delDep.mutate({ id: dep.id, depositDate: dep.deposit_date })}
                    loading={delDep.isPending}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {deposits.length > 0 && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
            <span className="text-xs text-white/40 font-display">Total Collected</span>
            <span className="font-display font-bold text-emerald-400">
              ৳{totalMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ─────────────────────────────────────────────────────────────
// TAB 3: BALANCE SHEET
// ─────────────────────────────────────────────────────────────
function BalanceTab({ yearMonth, members }) {
  const { data: sheet, isLoading, error, refetch } = useBalanceSheet(yearMonth, members);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="md" /></div>;
  if (error)     return <Alert type="error">Failed to calculate balance: {error.message}</Alert>;
  if (!sheet)    return null;

  const { rows, totalExpenses, totalMeals, mealRate } = sheet;
  const month = new Date(`${yearMonth}-15`).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Settlement instructions — who pays whom
  // Simple greedy: sort by balance, highest creditor pays to lowest debtor
  const creditors = rows.filter((r) => r.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors   = rows.filter((r) => r.balance < -0.01).sort((a, b) => a.balance - b.balance);

  const settlements = [];
  const cred = creditors.map((r) => ({ ...r, rem: r.balance }));
  const debt = debtors.map((r)   => ({ ...r, rem: Math.abs(r.balance) }));
  let ci = 0, di = 0;
  while (ci < cred.length && di < debt.length) {
    const pay = Math.min(cred[ci].rem, debt[di].rem);
    if (pay > 0.01) {
      settlements.push({
        from: debt[di].member.name,
        to:   cred[ci].member.name,
        amount: parseFloat(pay.toFixed(2)),
      });
    }
    cred[ci].rem -= pay;
    debt[di].rem -= pay;
    if (cred[ci].rem < 0.01) ci++;
    if (debt[di].rem < 0.01) di++;
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Expenses', value: `৳${totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: 'text-brand-400' },
          { label: 'Total Meals',    value: totalMeals,    color: 'text-emerald-400' },
          { label: 'Meal Rate',      value: mealRate > 0 ? `৳${mealRate.toFixed(2)}` : '—', color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-white/30 text-xs mb-1">{label}</p>
            <p className={`font-display font-bold text-lg ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Per-member balance table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/[0.05]">
          <h3 className="font-display font-semibold text-white text-sm">Balance Sheet — {month}</h3>
          <button onClick={() => refetch()} className="p-1.5 text-white/30 hover:text-white transition rounded-lg hover:bg-white/5">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {rows.length === 0 ? (
          <Empty icon={BarChart2} title="No data yet" description="Add expenses or deposits to see the balance." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['Member', 'Meals', 'Share (৳)', 'Paid (৳)', 'Deposited (৳)', 'Balance (৳)'].map((h) => (
                    <th key={h} className="px-4 sm:px-5 py-2.5 text-left font-display font-medium text-white/30 text-xs whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {rows.map(({ member, meals, share, paid, deposited, balance }) => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 sm:px-5 py-3 text-white/80 font-body whitespace-nowrap">{member.name}</td>
                    <td className="px-4 sm:px-5 py-3 text-white/50 font-display">{meals}</td>
                    <td className="px-4 sm:px-5 py-3 text-white/50 font-display">
                      {share.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-white/50 font-display">
                      {paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-white/50 font-display">
                      {deposited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 sm:px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {balance > 0.01 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : balance < -0.01 ? (
                          <TrendingDown className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-white/25 shrink-0" />
                        )}
                        <span className={`font-display font-bold text-sm ${
                          balance > 0.01 ? 'text-emerald-400' :
                          balance < -0.01 ? 'text-red-400' : 'text-white/30'
                        }`}>
                          {balance > 0 ? '+' : ''}{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 sm:px-5 py-2.5 border-t border-white/[0.04]">
          <p className="text-white/20 text-[10px]">
            Balance = (expenses paid by member + deposits) − (meals × meal rate). Positive = credit, Negative = owes.
          </p>
        </div>
      </div>

      {/* Settlement instructions */}
      {settlements.length > 0 && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-white text-sm mb-1">Settlement Instructions</h3>
          <p className="text-white/35 text-xs mb-4">To settle all balances for {month}:</p>
          <div className="space-y-2.5">
            {settlements.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-800 border border-white/[0.06]">
                <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <span className="text-red-400 text-[10px] font-bold">{s.from.charAt(0)}</span>
                </div>
                <span className="text-white/70 text-sm flex-1">
                  <span className="text-red-400 font-medium">{s.from}</span>
                  <span className="text-white/30 mx-2">pays</span>
                  <span className="text-emerald-400 font-medium">{s.to}</span>
                </span>
                <span className="font-display font-bold text-white text-sm shrink-0">
                  ৳{s.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {settlements.length === 0 && rows.length > 0 && (
        <div className="alert-success text-sm">
          <TrendingUp className="w-4 h-4 shrink-0" />
          All balances are settled for {month}! 🎉
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ExpensesPage() {
  const { member: currentMember } = useAuthStore();
  const isManager = currentMember?.role === 'manager';

  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState('expenses');

  const { data: members = [], isLoading: membersLoading } = useMembers();

  return (
    <div className="p-4 sm:p-6 space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Expenses</h1>
          <p className="text-white/40 text-sm mt-0.5">Track spending, deposits, and who owes what.</p>
        </div>
        <MonthNav yearMonth={yearMonth} onChange={setYearMonth} />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-surface-900 border border-white/[0.06] rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body transition-all ${
              activeTab === id
                ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20 font-medium'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {membersLoading ? (
        <div className="flex justify-center py-12"><Spinner size="md" /></div>
      ) : (
        <>
          {activeTab === 'expenses' && (
            <ExpensesTab yearMonth={yearMonth} members={members} isManager={isManager} currentMember={currentMember} />
          )}
          {activeTab === 'deposits' && (
            <DepositsTab yearMonth={yearMonth} members={members} isManager={isManager} currentMember={currentMember} />
          )}
          {activeTab === 'balance' && (
            <BalanceTab yearMonth={yearMonth} members={members} />
          )}
        </>
      )}
    </div>
  );
}
