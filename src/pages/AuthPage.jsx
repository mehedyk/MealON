// ============================================================
// src/pages/AuthPage.jsx
// Login / Signup / Forgot Password — all in one clean page.
// ============================================================
import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Logo, Alert, Field, Divider, Spinner } from '../components/ui';
import {
  validateEmail,
  validatePassword,
  validateName,
  sanitizeText,
} from '../utils/validate';

// ── Modes ────────────────────────────────────────────────────
const MODE = { LOGIN: 'login', SIGNUP: 'signup', FORGOT: 'forgot', VERIFY: 'verify' };

export default function AuthPage() {
  const { user, loading } = useAuthStore();
  const [mode, setMode] = useState(MODE.LOGIN);

  if (loading) return null; // parent handles PageLoader
  if (user)    return <Navigate to="/app" replace />;

  return (
    <div className="page min-h-screen flex">
      {/* ── Left panel (decorative, hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-surface-900 flex-col justify-between p-12">
        {/* Background gradient blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-700/8 blur-[100px] pointer-events-none" />

        <Logo size="lg" />

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Manage your mess<br />
            <span className="text-brand-400">the smart way.</span>
          </h1>
          <p className="text-white/50 text-lg font-body leading-relaxed">
            Track meals, split expenses, and manage members — all in one place. Built for Bangladeshi student messes and hostels.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { number: '🍛', label: 'Meal tracking' },
              { number: '৳', label: 'Expense splits' },
              { number: '👥', label: 'Member management' },
            ].map((f) => (
              <div key={f.label} className="card p-4 text-center">
                <div className="text-2xl mb-2">{f.number}</div>
                <div className="text-xs text-white/40 font-body">{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs font-body">
          © {new Date().getFullYear()} MealON. All rights reserved.
        </p>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-surface-950">
        <div className="w-full max-w-md animate-fade-up">
          {/* Logo on mobile */}
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          {mode === MODE.LOGIN   && <LoginForm   setMode={setMode} />}
          {mode === MODE.SIGNUP  && <SignupForm  setMode={setMode} />}
          {mode === MODE.FORGOT  && <ForgotForm  setMode={setMode} />}
          {mode === MODE.VERIFY  && <VerifyNotice setMode={setMode} />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN FORM
// ─────────────────────────────────────────────────────────────
function LoginForm({ setMode }) {
  const { loadMemberAndMess, setUser, setLoading } = useAuthStore();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    const em = validateEmail(email);
    if (!em.ok) e.email = em.message;
    if (!password) e.password = 'Password is required';
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizeText(email).toLowerCase(),
        password,
      });
      if (error) {
        // Normalise Supabase error messages to something user-friendly
        if (error.message.includes('Invalid login')) {
          setApiError('Incorrect email or password.');
        } else if (error.message.includes('Email not confirmed')) {
          setApiError('Please verify your email first. Check your inbox.');
        } else {
          setApiError(error.message);
        }
      } else {
        setUser(data.user);
        await loadMemberAndMess(data.user.id);
        setLoading(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-white mb-1">Welcome back</h2>
      <p className="text-white/40 text-sm mb-8">Sign in to your MealON account</p>

      {apiError && <Alert type="error" className="mb-5">{apiError}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Email" error={errors.email}>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={254}
            />
          </div>
        </Field>

        <Field label="Password" error={errors.password}>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type={showPw ? 'text' : 'password'}
              className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              maxLength={72}
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setMode(MODE.FORGOT)}
            className="text-xs text-brand-400 hover:text-brand-300 transition font-body"
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
          {submitting ? <Spinner /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <Divider>or</Divider>

      <p className="text-center text-sm text-white/40">
        New to MealON?{' '}
        <button
          onClick={() => setMode(MODE.SIGNUP)}
          className="text-brand-400 hover:text-brand-300 font-medium transition"
        >
          Create an account
        </button>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIGNUP FORM
// ─────────────────────────────────────────────────────────────
function SignupForm({ setMode }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [agreed, setAgreed]     = useState(false);
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    const nm = validateName(name, { label: 'Full name', min: 2 });
    if (!nm.ok) e.name = nm.message;
    const em = validateEmail(email);
    if (!em.ok) e.email = em.message;
    const pw = validatePassword(password);
    if (!pw.ok) e.password = pw.message;
    if (password !== confirm) e.confirm = 'Passwords do not match';
    if (!agreed) e.terms = 'You must agree to the Terms of Service';
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
      const nm = validateName(name, { label: 'Full name' });
      const em = validateEmail(email);

      const { error } = await supabase.auth.signUp({
        email: em.value,
        password,
        options: {
          data: { full_name: nm.value },
          emailRedirectTo: `${window.location.origin}/auth/verify`,
        },
      });
      if (error) {
        if (error.message.includes('already registered')) {
          setApiError('An account with this email already exists.');
        } else {
          setApiError(error.message);
        }
      } else {
        setMode(MODE.VERIFY);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setMode(MODE.LOGIN)}
        className="flex items-center gap-1 text-white/40 hover:text-white/70 text-sm mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" /> Back to login
      </button>

      <h2 className="font-display text-2xl font-bold text-white mb-1">Create account</h2>
      <p className="text-white/40 text-sm mb-8">Join MealON and manage your mess</p>

      {apiError && <Alert type="error" className="mb-5">{apiError}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Full Name" error={errors.name}>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              className={`input pl-10 ${errors.name ? 'input-error' : ''}`}
              placeholder="Mehedy Kawser"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={80}
            />
          </div>
        </Field>

        <Field label="Email" error={errors.email}>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={254}
            />
          </div>
        </Field>

        <Field label="Password" error={errors.password}>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type={showPw ? 'text' : 'password'}
              className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
              placeholder="Min. 8 chars, include a number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              maxLength={72}
            />
            <button
              type="button"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Password strength hint */}
          {password && (
            <div className="flex gap-1 mt-2">
              {[
                password.length >= 8,
                /[a-zA-Z]/.test(password),
                /[0-9]/.test(password),
                password.length >= 12,
              ].map((pass, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    pass ? 'bg-brand-500' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          )}
        </Field>

        <Field label="Confirm Password" error={errors.confirm}>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type={showPw ? 'text' : 'password'}
              className={`input pl-10 ${errors.confirm ? 'input-error' : ''}`}
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              maxLength={72}
            />
          </div>
        </Field>

        <div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                className="sr-only"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <div
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  agreed
                    ? 'bg-brand-500 border-brand-500'
                    : 'border-white/20 group-hover:border-white/40'
                } ${errors.terms ? 'border-red-500' : ''}`}
              >
                {agreed && (
                  <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-surface-950">
                    <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-white/40 leading-relaxed">
              I agree to the{' '}
              <Link to="/terms" className="text-brand-400 hover:underline" target="_blank">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-brand-400 hover:underline" target="_blank">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms && <p className="field-error mt-1">{errors.terms}</p>}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <Spinner /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD FORM
// ─────────────────────────────────────────────────────────────
function ForgotForm({ setMode }) {
  const [email, setEmail]   = useState('');
  const [errors, setErrors] = useState({});
  const [sent, setSent]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setApiError('');
    const em = validateEmail(email);
    if (!em.ok) { setErrors({ email: em.message }); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(em.value, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) setApiError(error.message);
      else setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setMode(MODE.LOGIN)}
        className="flex items-center gap-1 text-white/40 hover:text-white/70 text-sm mb-6 transition"
      >
        <ChevronLeft className="w-4 h-4" /> Back to login
      </button>

      <h2 className="font-display text-2xl font-bold text-white mb-1">Reset password</h2>
      <p className="text-white/40 text-sm mb-8">
        We'll send a reset link to your email.
      </p>

      {sent ? (
        <Alert type="success">
          Check your inbox! A reset link has been sent to <strong>{email}</strong>. It may take a minute.
        </Alert>
      ) : (
        <>
          {apiError && <Alert type="error" className="mb-5">{apiError}</Alert>}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="Email" error={errors.email}>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                />
              </div>
            </Field>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <Spinner /> : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// POST-SIGNUP EMAIL VERIFY NOTICE
// ─────────────────────────────────────────────────────────────
function VerifyNotice({ setMode }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-6">
        <Mail className="w-7 h-7 text-brand-400" />
      </div>
      <h2 className="font-display text-2xl font-bold text-white mb-2">Verify your email</h2>
      <p className="text-white/40 text-sm leading-relaxed mb-8">
        We've sent a confirmation link to your email. Open it to activate your account, then come back and sign in.
      </p>
      <button onClick={() => setMode(MODE.LOGIN)} className="btn-primary w-full">
        Back to Sign In
      </button>
    </div>
  );
}
