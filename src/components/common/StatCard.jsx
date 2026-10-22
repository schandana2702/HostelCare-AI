import React from 'react';

/**
 * StatCard — reusable metric card with dark-purple glassmorphic styling and glowing icon badges.
 * color prop options: 'purple' | 'slate' | 'blue' | 'mint' | 'cream' | 'peach' | 'emerald' | 'amber' | 'rose'
 */
export default function StatCard({ title, value, icon: Icon, color = 'purple', subtext, onClick }) {
  const schemes = {
    purple:  { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/35', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
    slate:   { bg: 'bg-purple-950/40', text: 'text-purple-200', border: 'border-purple-500/25', glow: 'shadow-none' },
    blue:    { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.25)]' },
    mint:    { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]' },
    cream:   { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]' },
    peach:   { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.25)]' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]' },
    amber:   { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/35', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]' },
    rose:    { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/35', glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]' }
  };

  const s = schemes[color] || schemes.purple;

  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group ${
        onClick ? ' cursor-pointer hover:scale-[1.02] active:scale-[0.99]' : ''
      }`}
    >
      {/* Subtle corner glow accent */}
      <div 
        className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" 
        aria-hidden="true"
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="min-w-0 pr-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-300/70 truncate">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight text-white">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-2xl border ${s.bg} ${s.border} ${s.glow} transition-transform group-hover:scale-110 shrink-0`}>
            <Icon className={`w-5 h-5 ${s.text}`} />
          </div>
        )}
      </div>

      {subtext && (
        <div className="mt-3 pt-2.5 border-t border-purple-500/15 text-xs font-medium text-purple-300/60 relative z-10">
          {subtext}
        </div>
      )}
    </div>
  );
}
