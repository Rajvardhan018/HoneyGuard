import React, { useState } from 'react';
import { useMode } from '../../context/ModeContext';
import { api } from '../../services/api';
import { X, Play, ShieldAlert, Zap, Repeat, CheckCircle } from 'lucide-react';

export default function QuickAttackModal() {
  const { isQuickAttackOpen, setIsQuickAttackOpen, mode, switchMode } = useMode();
  const [attackType, setAttackType] = useState('brute_force');
  const [service, setService] = useState('SSH');
  const [intensity, setIntensity] = useState(2);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  if (!isQuickAttackOpen) return null;

  const handleLaunchLab = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      if (mode !== 'LAB') {
        await switchMode('LAB');
      }
      const res = await api.triggerLabAttack({
        attack_type: attackType,
        service: service,
        intensity: parseInt(intensity)
      });
      setStatusMsg({
        success: true,
        text: `Successfully dispatched ${attackType.replace('_', ' ')} against ${service} honeypot! Threat score evaluated: ${res.event.threat_score} (${res.event.severity}).`
      });
    } catch (err) {
      setStatusMsg({ success: false, text: err.message || "Failed to trigger lab attack" });
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchReplay = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await switchMode('REPLAY');
      const res = await api.triggerReplay();
      setStatusMsg({
        success: true,
        text: `Replay active! Streaming 5 honeynet attack sessions through ML classifier and SOAR engine.`
      });
    } catch (err) {
      setStatusMsg({ success: false, text: err.message || "Failed to start replay" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-purple-100 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 via-white to-purple-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Lab Attack Simulator & Replay</h3>
              <p className="text-xs text-slate-500">Safely test isolated Honeypot sensors</p>
            </div>
          </div>
          <button
            onClick={() => setIsQuickAttackOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100/80 text-xs text-purple-900 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <span>
              All simulated attacks are confined to HoneyGuard's isolated sandbox sensors on ports 2222 (SSH) and 8080 (HTTP). No external host or production network is targeted.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Service Target
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['SSH', 'HTTP'].map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => {
                    setService(svc);
                    if (svc === 'SSH') setAttackType('brute_force');
                    else setAttackType('directory_scan');
                  }}
                  className={`py-2 px-4 rounded-xl text-sm font-semibold border transition-all ${
                    service === svc
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {svc === 'SSH' ? 'SSH-HONEY-01 (:2222)' : 'HTTP-HONEY-01 (:8080)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Attack Classification Type
            </label>
            <select
              value={attackType}
              onChange={(e) => setAttackType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            >
              {service === 'SSH' ? (
                <>
                  <option value="brute_force">SSH Password Brute Force (T1110.001)</option>
                  <option value="credential_attack">Default Credential Spray (T1078)</option>
                  <option value="command_exec">Shell Command Injection & Probe (T1059.004)</option>
                </>
              ) : (
                <>
                  <option value="directory_scan">Web Directory Traversal & Scan (T1083)</option>
                  <option value="sql_injection">SQL Injection Auth Bypass (T1190)</option>
                  <option value="bot_scan">Automated Botnet Reconnaissance (T1595.002)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Attack Velocity / Intensity
              </label>
              <span className="text-xs font-bold text-purple-700">Tier {intensity}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
              statusMsg.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {statusMsg.success && <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              onClick={handleLaunchLab}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md shadow-purple-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{loading ? "Processing..." : "Dispatch Lab Attack"}</span>
            </button>
            <button
              onClick={handleLaunchReplay}
              disabled={loading}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              title="Stream authentic honeynet attack capture dataset"
            >
              <Repeat className="w-4 h-4" />
              <span>Replay Corpus</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
