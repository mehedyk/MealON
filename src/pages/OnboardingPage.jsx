// ============================================================
// src/pages/OnboardingPage.jsx
// Step 1: Choose to create or join
// Step 2a: Create Mess form
// Step 2b: Join Mess form
// Step 3: Success / transition
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle, Hash, ArrowRight, ArrowLeft,
  ChefHat, Users, LogOut, CheckCircle2, Copy, Check,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Logo, Alert, Field, Spinner } from '../components/ui';
import {
  validateName,
  validateMessCode,
  validatePhone,
  sanitizeText,
} from '../utils/validate';

const STEP = { CHOOSE: 'choose', CREATE: 'create', JOIN: 'join', SUCCESS: 'success' };

export default function OnboardingPage() {
  const { user, signOut } = useAuthStore();
  const [step, setStep]       = useState(STEP.CHOOSE);
  const [result, setResult]   = useState(null); // { mess_name, mess_code, mode }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="page min-h-screen flex">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-surface-900 flex-col justify-between p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-500/8 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand-700/6 blur-[80px]" />
        </div>
        <Logo />
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold text-white mb-4 leading-tight">
            One mess,<br />everyone in sync.
          </h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Create a new mess and invite your housemates — or join one that already exists with a 6-character code.
          </p>
          <div className="space-y-3">
            {[
              { icon: ChefHat, text: 'Track daily meals per member' },
              { icon: Users,   text: 'Manage members & roles' },
              { icon: Hash,    text: 'Simple 6-char join codes' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <span className="text-sm text-white/50">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-white/25 hover:text-white/50 text-xs transition w-fit"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-surface-950">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile logo + sign out */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <Logo size="sm" />
            <button onClick={signOut} className="btn-ghost text-xs">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>

          {step === STEP.CHOOSE  && <ChooseStep  firstName={firstName} setStep={setStep} />}
          {step === STEP.CREATE  && <CreateStep  user={user} setStep={setStep} setResult={setResult} />}
          {step === STEP.JOIN    && <JoinStep    user={user} setStep={setStep} setResult={setResult} />}
          {step === STEP.SUCCESS && <SuccessStep result={result} />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 1 — CHOOSE
// ─────────────────────────────────────────────────────────────
function ChooseStep({ firstName, setStep }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-white mb-1">
        Hey, {firstName}! 👋
      </h2>
      <p className="text-white/40 text-sm mb-8">
        Let's get you set up. Do you want to create a new mess or join an existing one?
      </p>

      <div className="grid gap-4">
        <button
          onClick={() => setStep(STEP.CREATE)}
          className="group relative card p-6 text-left hover:border-brand-500/40 hover:bg-surface-800/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0 group-hover:bg-brand-500/25 transition">
              <PlusCircle className="w-5 h-5 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-white mb-1">Create a new mess</h3>
              <p className="text-xs text-white/40 leading-relaxed">
                You'll be the manager. Set the name, invite others with a code.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-brand-400 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
          </div>
        </button>

        <button
          onClick={() => setStep(STEP.JOIN)}
          className="group relative card p-6 text-left hover:border-white/[0.15] hover:bg-surface-800/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition">
              <Hash className="w-5 h-5 text-white/50" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-white mb-1">Join an existing mess</h3>
              <p className="text-xs text-white/40 leading-relaxed">
                Have a 6-character code? Enter it to join your housemates.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
          </div>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 2a — CREATE MESS
// ─────────────────────────────────────────────────────────────
function CreateStep({ user, setStep, setResult }) {
  const { refreshMess } = useAuthStore();
  const defaultName = user?.user_metadata?.full_name || '';

  const [messName,  setMessName]  = useState('');
  const [yourName,  setYourName]  = useState(defaultName);
  const [phone,     setPhone]     = useState('');
  const [errors,    setErrors]    = useState({});
  const [apiError,  setApiError]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    const mn = validateName(messName, { label: 'Mess name', min: 2, max: 80 });
    if (!mn.ok) e.messName = mn.message;
    const yn = validateName(yourName, { label: 'Your name', min: 2, max: 80 });
    if (!yn.ok) e.yourName = yn.message;
    const ph = validatePhone(phone);
    if (!ph.ok) e.phone = ph.message;
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setApiError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_mess', {
        p_mess_name: sanitizeText(messName),
        p_user_id:   user.id,
        p_name:      sanitizeText(yourName),
        p_email:     user.email,
        p_phone:     sanitizeText(phone),
      });

      if (error) {
        // Parse structured error messages from the RPC
        const msg = error.message || '';
        if (msg.includes('VALIDATION:'))      setApiError(msg.replace('VALIDATION:', '').trim());
        else if (msg.includes('ALREADY_IN_MESS:')) setApiError('You are already in a mess. Sign out and use a different account, or contact your mess manager.');
        else setApiError('Something went wrong. Please try again.');
      } else {
        await refreshMess();
        setResult({
          mode:      'created',
          mess_name: sanitizeText(messName),
          mess_code: data.mess_code,
        });
        setStep('success');
      }
    } catch (err) {
      setApiError('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setStep(STEP.CHOOSE)}
        className="flex items-center gap-1 text-white/40 hover:text-white/70 text-sm mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h2 className="font-display text-2xl font-bold text-white mb-1">Create your mess</h2>
      <p className="text-white/40 text-sm mb-8">
        You'll become the manager. A unique 6-character code will be generated — share it to invite members.
      </p>

      {apiError && <Alert type="error" className="mb-5">{apiError}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Mess Name" error={errors.messName}>
          <input
            type="text"
            className={`input ${errors.messName ? 'input-error' : ''}`}
            placeholder="e.g. DIU Block-C Mess, Uttara Bachelor Mess"
            value={messName}
            onChange={(e) => setMessName(e.target.value)}
            maxLength={80}
            autoFocus
          />
          <p className="text-white/25 text-xs mt-1.5">
            {messName.length}/80 — give it a name your members will recognise
          </p>
        </Field>

        <Field label="Your Display Name" error={errors.yourName}>
          <input
            type="text"
            className={`input ${errors.yourName ? 'input-error' : ''}`}
            placeholder="How your members will see you"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            maxLength={80}
          />
        </Field>

        <Field label="Phone (optional)" error={errors.phone}>
          <input
            type="tel"
            className={`input ${errors.phone ? 'input-error' : ''}`}
            placeholder="+8801XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
          />
        </Field>

        {/* Manager perks reminder */}
        <div className="alert-info text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>As manager you can add/remove members, log expenses for others, and manage mess rules.</span>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
          {submitting
            ? <><Spinner /> Creating mess…</>
            : <>Create Mess <ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 2b — JOIN MESS
// ─────────────────────────────────────────────────────────────
function JoinStep({ user, setStep, setResult }) {
  const { refreshMess } = useAuthStore();
  const defaultName = user?.user_metadata?.full_name || '';

  const [code,      setCode]      = useState('');
  const [yourName,  setYourName]  = useState(defaultName);
  const [phone,     setPhone]     = useState('');
  const [errors,    setErrors]    = useState({});
  const [apiError,  setApiError]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Format code input: uppercase, max 6 chars, alphanumeric only
  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(val);
  };

  const validate = () => {
    const e = {};
    const cd = validateMessCode(code);
    if (!cd.ok) e.code = cd.message;
    const yn = validateName(yourName, { label: 'Your name', min: 2, max: 80 });
    if (!yn.ok) e.yourName = yn.message;
    const ph = validatePhone(phone);
    if (!ph.ok) e.phone = ph.message;
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setApiError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('join_mess', {
        p_code:    code.trim().toUpperCase(),
        p_user_id: user.id,
        p_name:    sanitizeText(yourName),
        p_email:   user.email,
        p_phone:   sanitizeText(phone),
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('NOT_FOUND:'))          setApiError('No mess found with that code. Double-check it and try again.');
        else if (msg.includes('ALREADY_MEMBER:')) setApiError('You\'re already a member of this mess.');
        else if (msg.includes('ALREADY_IN_MESS:')) setApiError('You\'re already in another mess. You can only be in one mess at a time.');
        else if (msg.includes('VALIDATION:'))     setApiError(msg.replace('VALIDATION:', '').trim());
        else setApiError('Something went wrong. Please try again.');
      } else {
        await refreshMess();
        setResult({
          mode:      'joined',
          mess_name: data.mess_name,
          mess_code: data.mess_code,
        });
        setStep('success');
      }
    } catch (err) {
      setApiError('Unexpected error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setStep(STEP.CHOOSE)}
        className="flex items-center gap-1 text-white/40 hover:text-white/70 text-sm mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h2 className="font-display text-2xl font-bold text-white mb-1">Join a mess</h2>
      <p className="text-white/40 text-sm mb-8">
        Ask your mess manager for the 6-character code and enter it below.
      </p>

      {apiError && <Alert type="error" className="mb-5">{apiError}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Mess Code" error={errors.code}>
          <div className="relative">
            <input
              type="text"
              className={`input text-center font-display text-2xl tracking-[0.4em] uppercase pr-4 ${errors.code ? 'input-error' : ''}`}
              placeholder="A1B2C3"
              value={code}
              onChange={handleCodeChange}
              maxLength={6}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            {/* Character dots indicator */}
            <div className="flex justify-center gap-1.5 mt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                    i < code.length ? 'bg-brand-400' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </Field>

        <Field label="Your Display Name" error={errors.yourName}>
          <input
            type="text"
            className={`input ${errors.yourName ? 'input-error' : ''}`}
            placeholder="How your members will see you"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            maxLength={80}
          />
        </Field>

        <Field label="Phone (optional)" error={errors.phone}>
          <input
            type="tel"
            className={`input ${errors.phone ? 'input-error' : ''}`}
            placeholder="+8801XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={20}
          />
        </Field>

        <button type="submit" disabled={submitting || code.length < 6} className="btn-primary w-full mt-2">
          {submitting
            ? <><Spinner /> Joining…</>
            : <>Join Mess <ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP 3 — SUCCESS
// ─────────────────────────────────────────────────────────────
function SuccessStep({ result }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(result.mess_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available (http)
    }
  };

  return (
    <div className="text-center animate-fade-up">
      {/* Animated checkmark */}
      <div className="relative mx-auto w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-40" />
        <div className="relative w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-emerald-400" />
        </div>
      </div>

      <h2 className="font-display text-2xl font-bold text-white mb-1">
        {result?.mode === 'created' ? 'Mess created! 🎉' : 'You\'re in! 🎉'}
      </h2>
      <p className="text-white/40 text-sm mb-8">
        {result?.mode === 'created'
          ? 'Your mess is ready. Share the code below with your housemates.'
          : `You've joined ${result?.mess_name}. Welcome aboard.`
        }
      </p>

      {/* Mess code card */}
      <div className="card p-6 mb-6 text-left">
        <p className="label mb-3">Mess Name</p>
        <p className="font-display font-semibold text-white text-lg mb-4">{result?.mess_name}</p>

        {result?.mode === 'created' && (
          <>
            <p className="label mb-3">Share this code with members</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-surface-800 rounded-xl px-4 py-3 font-display text-2xl font-bold text-brand-400 tracking-[0.4em] text-center border border-brand-500/20">
                {result?.mess_code}
              </div>
              <button
                onClick={copyCode}
                className={`p-3 rounded-xl border transition-all ${
                  copied
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-surface-800 border-white/10 text-white/50 hover:text-white hover:border-white/20'
                }`}
                title="Copy code"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-white/30 mt-2 text-center">
              Members can join using this code from the app.
            </p>
          </>
        )}
      </div>

      <button
        onClick={() => navigate('/app')}
        className="btn-primary w-full"
      >
        Go to Dashboard <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
