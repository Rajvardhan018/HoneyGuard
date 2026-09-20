import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import HoneypotCube from '../components/3d/HoneypotCube';
import AddHoneypotModal from '../components/honeypots/AddHoneypotModal';
import { api } from '../services/api';
import {
  Server,
  Play,
  Square,
  RotateCw,
  Sliders,
  ExternalLink,
  Shield,
  Activity,
  Plus,
  Terminal,
  CheckCircle2,
  X
} from 'lucide-react';

export default function Honeypots() {
  const [honeypots, setHoneypots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionsHp, setActiveSessionsHp] = useState(null);
  const [sessionsList, setSessionsList] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    fetchHoneypots();
  }, []);

  const fetchHoneypots = async () => {
    try {
      const data = await api.getHoneypots();
      setHoneypots(data);
    } catch (err) {
      console.error("Failed to load honeypots:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, deception = null) => {
    setActionLoading(true);
    try {
      await api.performHoneypotAction(id, action, deception);
      await fetchHoneypots();
      setToastMsg(`Honeypot ${id} successfully updated (${action}).`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      setToastMsg(`Action failed: ${err.message}`);
      setTimeout(() => setToastMsg(null), 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleHoneypotCreated = (newHp) => {
    setHoneypots(prev => {
      if (prev.some(h => h.id === newHp.id)) return prev;
      return [...prev, newHp];
    });
    setToastMsg(`Honeypot '${newHp.name}' successfully deployed on port ${newHp.port}!`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleViewSessions = async (hp) => {
    setActiveSessionsHp(hp);
    try {
      const sess = await api.getHoneypotSessions(hp.id);
      setSessionsList(sess);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days} days, ${hours} hours`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-honey-indigo tracking-tight">Honeypots</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage and monitor isolated deception sensors</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-honey-indigo hover:bg-purple-900 text-white font-semibold text-xs shadow-md shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Honeypot</span>
        </button>
      </div>

      {/* Honeypot Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {honeypots.map((hp) => {
          const isSSH = hp.type === 'ssh';
          const isActive = hp.status === 'active';

          return (
            <GlassCard key={hp.id} className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-extrabold text-honey-indigo">{hp.name}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700'
                    }`}>
                      {isActive ? 'ACTIVE' : 'STOPPED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {hp.description}
                  </p>
                </div>
              </div>

              {/* 3D Server Module & Specs */}
              <div className="grid grid-cols-12 gap-4 items-center bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60">
                <div className="col-span-4 flex justify-center">
                  <HoneypotCube type={isSSH ? "SSH" : "HTTP"} deceptionLevel={hp.deception_level} className="h-32 w-32" />
                </div>
                
                <div className="col-span-8 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400">Port</span>
                    <span className="text-sm font-bold font-mono text-slate-800">{hp.port}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400">Uptime</span>
                    <span className="text-xs font-bold text-slate-800">{formatUptime(hp.uptime_seconds)}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400">Sessions</span>
                    <span className="text-sm font-bold text-slate-800">{hp.sessions_count}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400">Attacks Trapped</span>
                    <span className="text-sm font-bold text-purple-700">{hp.attacks_count}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-purple-100/80 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Current Deception:</span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase bg-purple-600 text-white shadow-sm shadow-purple-500/20">
                      {hp.deception_level} DECEPTION
                    </span>
                  </div>
                </div>
              </div>

              {/* Deception Tier Selector */}
              <div>
                <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Tune Deception Tier
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleAction(hp.id, 'set_deception', lvl)}
                      disabled={actionLoading}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                        hp.deception_level === lvl
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons matching Reference UI */}
              <div className="pt-2 flex items-center space-x-3">
                {isActive ? (
                  <button
                    onClick={() => handleAction(hp.id, 'stop')}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-3 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction(hp.id, 'start')}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start</span>
                  </button>
                )}

                <button
                  onClick={() => handleAction(hp.id, 'restart')}
                  disabled={actionLoading}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Restart</span>
                </button>

                <button
                  onClick={() => handleViewSessions(hp)}
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Adaptive Deception Info Card matching Reference UI */}
      <GlassCard className="p-6 bg-gradient-to-r from-purple-50/60 via-white to-purple-50/40 border-purple-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-honey-indigo">Adaptive Deception Engine Active</h3>
              <p className="text-xs text-slate-500 max-w-xl mt-0.5">
                Honeypots automatically adjust decoy responses, latency, and honeytokens based on attacker sophistication, ML risk score, and repeat intrusion velocity.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-700 self-end md:self-auto">
            <span>More Attacks → More Intelligence → Stronger Defense</span>
          </div>
        </div>
      </GlassCard>

      {/* Session Details Modal */}
      {activeSessionsHp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{activeSessionsHp.name} - Inbound Sessions</h3>
                <p className="text-xs text-slate-500">Captured honeypot connections</p>
              </div>
              <button
                onClick={() => setActiveSessionsHp(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {sessionsList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No sessions recorded yet for this sensor.</div>
              ) : (
                sessionsList.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-mono font-bold text-slate-800">{s.source_ip}:{s.source_port}</div>
                      <div className="text-slate-400 text-[11px]">{new Date(s.start_time).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold text-[10px]">
                        {s.protocol}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">{s.duration_seconds}s duration</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Honeypot Modal */}
      <AddHoneypotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleHoneypotCreated}
      />

      {/* In-App Glassmorphism Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-purple-200/80 shadow-2xl flex items-center space-x-3 text-xs font-semibold text-slate-800 animate-slideUp max-w-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="font-bold text-honey-indigo block">Sensor Notification</span>
            <span className="text-slate-600 font-normal">{toastMsg}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
