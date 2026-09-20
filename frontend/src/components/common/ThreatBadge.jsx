import React from 'react';

const SEVERITY_STYLES = {
  CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/20 font-semibold',
  HIGH: 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold',
  MEDIUM: 'bg-purple-500/10 text-purple-600 border-purple-500/20 font-medium',
  LOW: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium',
};

export default function ThreatBadge({ severity = 'LOW', className = '' }) {
  const sevKey = (severity || 'LOW').toUpperCase();
  const style = SEVERITY_STYLES[sevKey] || SEVERITY_STYLES.LOW;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs tracking-wide uppercase border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80 animate-pulse" />
      {sevKey}
    </span>
  );
}
