import React from 'react';
import GlassCard from './GlassCard';

export default function MetricCard({
  title,
  value,
  icon: Icon,
  delta = '+12%',
  deltaType = 'increase', // increase, decrease, neutral
  color = 'purple', // purple, red, amber, green
}) {
  const colorMap = {
    purple: {
      bg: 'bg-purple-100/70',
      text: 'text-purple-600',
      glow: 'shadow-[0_4px_20px_rgba(147,51,234,0.15)]',
    },
    red: {
      bg: 'bg-red-100/70',
      text: 'text-red-500',
      glow: 'shadow-[0_4px_20px_rgba(239,68,68,0.15)]',
    },
    amber: {
      bg: 'bg-amber-100/70',
      text: 'text-amber-500',
      glow: 'shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
    },
    green: {
      bg: 'bg-emerald-100/70',
      text: 'text-emerald-500',
      glow: 'shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
    },
  };

  const scheme = colorMap[color] || colorMap.purple;

  return (
    <GlassCard className="p-5 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scheme.bg} ${scheme.text} ${scheme.glow}`}>
          {Icon && <Icon className="w-6 h-6 stroke-[2]" />}
        </div>
        <div>
          <div className="text-2xl font-bold text-honey-text tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">
            {title}
          </div>
        </div>
      </div>
      {delta && (
        <div className="flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100/80 text-slate-600">
          <span className="mr-0.5">{delta.startsWith('+') ? '↑' : '↓'}</span>
          {delta}
        </div>
      )}
    </GlassCard>
  );
}
