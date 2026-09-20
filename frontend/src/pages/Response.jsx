import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { api } from '../services/api';
import {
  Cpu,
  Play,
  CheckCircle2,
  Lock,
  Clock,
  Shield,
  Zap,
  RotateCcw
} from 'lucide-react';

export default function Response() {
  const [playbooks, setPlaybooks] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [blocklist, setBlocklist] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [simTargetIp, setSimTargetIp] = useState('185.199.110.23');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pb, ex, bl] = await Promise.all([
        api.getPlaybooks(),
        api.getExecutions(),
        api.getBlocklist()
      ]);
      setPlaybooks(pb);
      setExecutions(ex);
      setBlocklist(bl);
    } catch (err) {
      console.error("Failed to load SOAR data:", err);
    }
  };

  const handleSimulate = async (playbookId) => {
    setSimulating(true);
    try {
      await api.simulatePlaybook(playbookId, simTargetIp, 88.0);
      await fetchData();
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-honey-indigo tracking-tight">SOAR & Automated Response</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Automated security orchestration, active quarantine & playbook workflows</p>
      </div>

      {/* Playbooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {playbooks.map((pb) => (
          <GlassCard key={pb.id} className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-purple-700">{pb.id}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    ACTIVE
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800">{pb.name}</h3>
                <p className="text-xs text-slate-500">{pb.description}</p>
              </div>

              <button
                onClick={() => handleSimulate(pb.id)}
                disabled={simulating}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 flex-shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Run</span>
              </button>
            </div>

            {/* Trigger Rule */}
            <div className="p-3 bg-slate-50 rounded-xl font-mono text-xs text-slate-700 border border-slate-200">
              <span className="text-slate-400 font-bold">TRIGGER: </span>
              <span className="text-purple-700 font-bold">{pb.trigger_condition}</span>
            </div>

            {/* Steps Checklist */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Playbook Action Steps:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(pb.actions || []).map((act, idx) => (
                  <div key={idx} className="flex items-center space-x-2 p-2 rounded-lg bg-white/70 border border-slate-200/60 text-slate-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span className="truncate">{act.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Split: Execution Audit Log & Active Blocklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Playbook Executions (8 cols) */}
        <GlassCard className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Playbook Execution Audit Log</h3>
              <p className="text-xs text-slate-400">Step-by-step verified execution pipeline</p>
            </div>
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-purple-600 hover:bg-slate-50"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {executions.map((ex) => (
              <div key={ex.id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-xs text-purple-700">{ex.id}</span>
                    <span className="font-bold text-xs text-slate-800">{ex.playbook_name || ex.playbook_id}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span>Started: {new Date(ex.started_at).toLocaleTimeString()}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                      {ex.status}
                    </span>
                  </div>
                </div>

                {/* Steps Checklist with Checkmarks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {(ex.execution_steps || []).map((st, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs p-2 rounded-lg bg-white border border-slate-200/70">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px]">
                        ✓
                      </span>
                      <span className="font-medium text-slate-700 truncate">{st.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Active Blocklist / Quarantine (4 cols) */}
        <GlassCard className="lg:col-span-4 p-6 space-y-4">
          <div className="flex items-center space-x-2 text-slate-800">
            <Lock className="w-4 h-4 text-purple-600" />
            <h3 className="text-base font-bold">Simulated Quarantine</h3>
          </div>
          <p className="text-xs text-slate-400">IPs isolated by autonomous SOAR playbooks</p>

          <div className="space-y-2.5">
            {blocklist.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">{item.ip_address}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700">
                    QUARANTINE
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">{item.reason}</p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Enacted: {new Date(item.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
