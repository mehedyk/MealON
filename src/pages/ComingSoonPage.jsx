// ============================================================
// src/pages/ComingSoonPage.jsx
// Placeholder for pages arriving in Chunks 4–7.
// ============================================================
import React from 'react';
import { Construction, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ComingSoonPage({ title = 'Coming Soon', description, chunk }) {
  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
          <Construction className="w-6 h-6 text-brand-400" />
        </div>
        <h2 className="font-display text-xl font-bold text-white mb-2">{title}</h2>
        {description && (
          <p className="text-white/40 text-sm leading-relaxed mb-2">{description}</p>
        )}
        {chunk && (
          <p className="text-brand-400/60 text-xs font-display font-medium mb-6">
            Arriving in Chunk {chunk} 🚧
          </p>
        )}
        <Link to="/app/dashboard" className="btn-ghost text-sm">
          Back to Dashboard <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
