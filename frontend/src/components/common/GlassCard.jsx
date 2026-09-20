import React from 'react';

export default function GlassCard({ children, className = '', hover = true, onClick = null, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgba(109,40,217,0.06)] ${
        hover ? 'transition-all duration-300 hover:shadow-[0_12px_36px_rgba(109,40,217,0.11)] hover:border-purple-200/80' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
