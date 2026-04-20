// ============================================================
// src/components/ui/index.jsx
// Reusable primitives used across the app.
// ============================================================
import React from 'react';
import { AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';

// ── Logo ─────────────────────────────────────────────────────
export const Logo = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-2xl' },
    lg: { icon: 44, text: 'text-3xl' },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className="flex items-center justify-center rounded-xl bg-brand-500 font-display font-bold text-surface-950 shadow-lg shadow-brand-500/30"
        style={{ width: s.icon, height: s.icon, fontSize: s.icon * 0.55 }}
      >
        M
      </div>
      <span className={`font-display font-bold text-white ${s.text}`}>
        Meal<span className="text-brand-400">ON</span>
      </span>
    </div>
  );
};

// ── Spinner ───────────────────────────────────────────────────
export const Spinner = ({ size = 'sm', className = '' }) => {
  const sz = size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-6 h-6' : 'w-4 h-4';
  return (
    <Loader2
      className={`animate-spin text-brand-400 ${sz} ${className}`}
    />
  );
};

// ── Full-page loading screen ──────────────────────────────────
export const PageLoader = () => (
  <div className="page flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Logo size="lg" />
      <Spinner size="md" className="mt-2" />
    </div>
  </div>
);

// ── Alert ─────────────────────────────────────────────────────
export const Alert = ({ type = 'info', children, className = '' }) => {
  const configs = {
    success: { cls: 'alert-success', Icon: CheckCircle },
    error:   { cls: 'alert-error',   Icon: AlertCircle },
    info:    { cls: 'alert-info',     Icon: Info },
  };
  const { cls, Icon } = configs[type] || configs.info;
  return (
    <div className={`${cls} ${className}`} role="alert">
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
};

// ── Field error message ───────────────────────────────────────
export const FieldError = ({ message }) => {
  if (!message) return null;
  return (
    <p className="field-error" role="alert">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {message}
    </p>
  );
};

// ── Input wrapper with label + error ─────────────────────────
export const Field = ({ label, error, children, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    {label && <label className="label">{label}</label>}
    {children}
    <FieldError message={error} />
  </div>
);

// ── Divider with optional text ────────────────────────────────
export const Divider = ({ children }) => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full h-px bg-white/[0.07]" />
    </div>
    {children && (
      <div className="relative flex justify-center">
        <span className="px-4 bg-surface-950 text-white/30 text-xs font-body">
          {children}
        </span>
      </div>
    )}
  </div>
);

// ── Empty state ───────────────────────────────────────────────
export const Empty = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {Icon && (
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white/30" />
      </div>
    )}
    <h3 className="font-display font-semibold text-white/70 mb-1">{title}</h3>
    {description && <p className="text-sm text-white/40 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
