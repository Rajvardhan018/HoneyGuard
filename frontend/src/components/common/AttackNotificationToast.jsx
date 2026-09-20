import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../context/WebSocketContext';
import ThreatBadge from './ThreatBadge';
import { ShieldAlert, X, ChevronRight } from 'lucide-react';

export default function AttackNotificationToast() {
  const { attackNotifications, dismissNotification } = useWebSocket();
  const navigate = useNavigate();

  if (!attackNotifications.length) return null;

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col space-y-3 pointer-events-none">
      {attackNotifications.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-purple-200/90 shadow-2xl p-4 transition-all transform animate-slideInRight"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  New Attack Detected
                </span>
                <span className="block text-[11px] text-slate-400">
                  {n.mode || 'LIVE'} Sensor • {n.service}
                </span>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(n.id)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-800">{n.attack_type}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{n.source_ip}</div>
            </div>
            <div className="text-right">
              <ThreatBadge severity={n.severity} />
              <div className="text-[11px] font-bold text-purple-700 mt-1">
                Score: {n.threat_score}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                dismissNotification(n.id);
                navigate(`/attacks/${n.id}`);
              }}
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center space-x-1"
            >
              <span>Investigate Session</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
