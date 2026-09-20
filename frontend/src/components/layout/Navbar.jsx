import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMode } from '../../context/ModeContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { Search, Bell, Shield, Zap, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  const { mode, setIsQuickAttackOpen } = useMode();
  const { isConnected, attackNotifications } = useWebSocket();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const modeBadge = {
    LIVE: { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', dot: 'bg-emerald-500' },
    LAB: { bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20', dot: 'bg-amber-500' },
    REPLAY: { bg: 'bg-purple-500/10 text-purple-600 border-purple-500/20', dot: 'bg-purple-500' }
  }[mode] || { bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', dot: 'bg-emerald-500' };

  return (
    <header className="h-16 px-6 bg-white/70 backdrop-blur-xl border-b border-white/80 shadow-[0_4px_20px_rgba(109,40,217,0.03)] flex items-center justify-between sticky top-0 z-30">
      {/* Search Bar */}
      <div className="relative w-80 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search anything, IPs, IOCs, CVEs..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/60 border border-transparent text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-5">
        {/* Mode & Safe Simulator Trigger Button */}
        <button
          onClick={() => setIsQuickAttackOpen(true)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-all shadow-sm ${modeBadge.bg} hover:shadow-md hover:scale-[1.02]`}
          title="Click to toggle between LIVE, LAB, and REPLAY modes or test honeypot sensors"
        >
          <span className={`w-2 h-2 rounded-full ${modeBadge.dot} animate-pulse`} />
          <span>MODE: {mode}</span>
          <Zap className="w-3.5 h-3.5 ml-1 opacity-70" />
        </button>

        {/* Date & Time Widget matching Reference UI */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-[11px] font-semibold text-slate-700">
            {formatDate(currentTime)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsQuickAttackOpen(true)}
            className="w-9 h-9 rounded-xl bg-white/80 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-purple-600 hover:border-purple-200 shadow-sm transition-all"
          >
            <Bell className="w-4 h-4" />
            {attackNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {attackNotifications.length}
              </span>
            )}
          </button>
        </div>

        {/* User Profile matching Reference UI */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-700 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-purple-500/20">
            RS
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-honey-text leading-tight">
              {user?.full_name || "Analyst"}
            </div>
            <div className="text-[10px] text-slate-400">
              Security Team
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
