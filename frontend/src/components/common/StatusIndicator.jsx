import React from 'react';

export default function StatusIndicator({ status = "All systems operational", isOperational = true }) {
  return (
    <div className="flex items-center space-x-2.5 px-3.5 py-2 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm backdrop-blur-md">
      <span className="relative flex h-2.5 w-2.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          isOperational ? 'bg-emerald-400' : 'bg-red-400'
        }`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
          isOperational ? 'bg-emerald-500' : 'bg-red-500'
        }`} />
      </span>
      <div className="text-xs">
        <span className="font-semibold text-slate-700">System Status</span>
        <span className="block text-[10px] text-slate-400 leading-tight">{status}</span>
      </div>
    </div>
  );
}
