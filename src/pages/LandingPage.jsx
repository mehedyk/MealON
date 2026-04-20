// ============================================================
// src/pages/LandingPage.jsx
// Public homepage. Shows the product, pushes to /auth.
// ============================================================
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed, Wallet, Users, BarChart3,
  Shield, Zap, ArrowRight, ChevronDown,
} from 'lucide-react';
import { Logo } from '../components/ui';

const FEATURES = [
  {
    icon: UtensilsCrossed,
    title: 'Meal Tracking',
    desc: 'Log breakfast, lunch, and dinner per member. Monthly grid view. Fair meal-rate calculations.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Wallet,
    title: 'Expense Splitting',
    desc: 'Add shared expenses with categories. See who owes whom in real time. One-click settlements.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Users,
    title: 'Member Management',
    desc: 'Invite via 6-char mess code. Role-based access (Manager / Member). Remove, reassign roles.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    desc: 'Monthly summaries, per-member cost breakdowns, and PDF export for record-keeping.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Shield,
    title: 'Secure by Design',
    desc: 'Row-level security on every table. Email verification. No data shared across messes.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    desc: 'Supabase real-time subscriptions. Any member adds an expense — everyone sees it instantly.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
];

const STEPS = [
  { n: '01', title: 'Create an account', desc: 'Sign up with your email. Verify in one click.' },
  { n: '02', title: 'Create or join a mess', desc: 'Create your mess and share the 6-char code, or enter a code to join an existing one.' },
  { n: '03', title: 'Start tracking', desc: 'Log meals, add expenses, invite members. Everything updates in real time.' },
];

export default function LandingPage() {
  const heroRef = useRef(null);

  // Parallax blob on mousemove — subtle, not distracting
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handleMove = (e) => {
      const { clientX: x, clientY: y } = e;
      const { width, height } = hero.getBoundingClientRect();
      const dx = (x / width  - 0.5) * 30;
      const dy = (y / height - 0.5) * 30;
      hero.style.setProperty('--blob-x', `${dx}px`);
      hero.style.setProperty('--blob-y', `${dy}px`);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="page">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <Link to="/auth" className="btn-ghost text-sm">Sign In</Link>
            <Link to="/auth" className="btn-primary text-sm px-4 py-2">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center"
        style={{ '--blob-x': '0px', '--blob-y': '0px' }}
      >
        {/* Blobs */}
        <div
          className="absolute top-1/4 left-1/2 w-[700px] h-[700px] rounded-full bg-brand-500/8 blur-[160px] pointer-events-none transition-transform duration-700"
          style={{ transform: 'translate(calc(-50% + var(--blob-x)), calc(-50% + var(--blob-y)))' }}
        />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-brand-700/6 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-soft" />
            <span className="text-xs font-display font-medium text-brand-400 tracking-wide">Built for Bangladeshi Messes</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.08] tracking-tight mb-6 animate-fade-up">
            Your mess,<br />
            <span className="text-brand-400">fully organized.</span>
          </h1>

          <p className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
            MealON is the no-nonsense mess management app — track meals, split costs, manage members, and generate monthly reports. In one place.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
            <Link to="/auth" className="btn-primary px-8 py-3.5 text-base shadow-lg shadow-brand-500/25">
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="btn-ghost px-6 py-3.5 text-base">
              See Features <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-20 grid grid-cols-3 gap-4 max-w-lg mx-auto animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
            {[
              { v: 'Free', l: 'Forever' },
              { v: 'Real-time', l: 'Updates' },
              { v: 'Secure', l: 'By Design' },
            ].map((s) => (
              <div key={s.l} className="card p-4 text-center">
                <div className="font-display text-lg font-bold text-brand-400">{s.v}</div>
                <div className="text-xs text-white/30 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-brand-400 text-xs font-display font-semibold uppercase tracking-widest text-center mb-3">How It Works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-16">Up and running in 3 steps</h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative card p-7">
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-10 right-0 translate-x-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-white/20" />
                  </div>
                )}
                <div className="font-display text-4xl font-bold text-white/[0.06] mb-4">{s.n}</div>
                <h3 className="font-display text-base font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-brand-400 text-xs font-display font-semibold uppercase tracking-widest text-center mb-3">Features</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white text-center mb-16">Everything your mess needs</h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 group hover:border-white/[0.12] transition-colors">
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-display text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to fix your mess?
          </h2>
          <p className="text-white/40 mb-8 text-lg">
            Free forever. No credit card required.
          </p>
          <Link to="/auth" className="btn-primary px-10 py-4 text-base shadow-xl shadow-brand-500/20">
            Create Your Mess <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.05] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-5 text-xs text-white/30">
            <Link to="/terms"   className="hover:text-white/60 transition">Terms</Link>
            <Link to="/privacy" className="hover:text-white/60 transition">Privacy</Link>
            <span>© {new Date().getFullYear()} MealON</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
