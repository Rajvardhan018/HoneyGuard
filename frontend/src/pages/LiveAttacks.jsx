import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../components/common/GlassCard';
import ThreatBadge from '../components/common/ThreatBadge';
import ThreatGlobe from '../components/3d/ThreatGlobe';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import {
  Radio,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  Terminal,
  Activity,
  Globe2
} from 'lucide-react';

export default function LiveAttacks() {
  const [attacks, setAttacks] = useState([]);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { latestAttack, activityStream } = useWebSocket();

  useEffect(() => {
    fetchAttacks();
  }, [serviceFilter, severityFilter]);

  // Insert newly arrived WebSocket attack into the top of the table dynamically
  useEffect(() => {
    if (latestAttack) {
      setAttacks(prev => [latestAttack, ...prev.slice(0, 49)]);
    }
  }, [latestAttack]);

  const fetchAttacks = async () => {
    try {
      const params = {};
      if (serviceFilter) params.service = serviceFilter;
      if (severityFilter) params.severity = severityFilter;
      const data = await api.getAttacks(params);
      setAttacks(data);
    } catch (err) {
      console.error("Failed to load attacks:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttacks = attacks.filter(atk => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      atk.source_ip.toLowerCase().includes(term) ||
      atk.attack_type.toLowerCase().includes(term) ||
      atk.service.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header matching Reference UI */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-honey-indigo tracking-tight">Live Attacks</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-500 text-white font-black text-[10px] tracking-wider uppercase animate-pulse flex items-center space-x-1 shadow-sm shadow-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>LIVE</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Real-time attack feed from isolated honeypot sensors</p>
        </div>

        {/* Counter Pills matching Reference UI */}
        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200/80 shadow-sm text-center">
            <div className="text-lg font-black text-red-600">17</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active Now</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200/80 shadow-sm text-center">
            <div className="text-lg font-black text-honey-indigo">127</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Today</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200/80 shadow-sm text-center">
            <div className="text-lg font-black text-purple-700">2,841</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">This Week</div>
          </div>
        </div>
      </div>

      {/* 3D Threat Globe + Live Activity Stream Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: 3D Threat Globe with Floating Top Countries Card */}
        <GlassCard className="lg:col-span-7 p-6 relative overflow-hidden flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between z-10">
            <div>
              <h3 className="text-base font-bold text-slate-800">Ballistic Threat Trajectories</h3>
              <p className="text-xs text-slate-400">Incoming sensor ingress mapped to origin ASN nodes</p>
            </div>
          </div>

          <ThreatGlobe className="h-[280px] w-full" />

          {/* Floating Top Attacking Countries Card matching Reference UI */}
          <div className="absolute bottom-5 left-5 z-10 p-3.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-white shadow-xl text-xs w-48 space-y-1.5">
            <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
              Top Attacking Countries
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>🇷🇺 Russia</span>
                <span className="font-bold text-purple-700">32%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>🇺🇸 United States</span>
                <span className="font-bold text-purple-700">21%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>🇨🇳 China</span>
                <span className="font-bold text-purple-700">14%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>🇩🇪 Germany</span>
                <span className="font-bold text-purple-700">8%</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>🇸🇬 Singapore</span>
                <span className="font-bold text-purple-700">6%</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Right: Live Activity Terminal Stream matching Reference UI */}
        <GlassCard className="lg:col-span-5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-800 mb-1">
              <Terminal className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-bold">Live Activity Stream</h3>
            </div>
            <p className="text-xs text-slate-400">Automated sensor event dispatch log</p>
          </div>

          <div className="mt-3 p-3.5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] h-64 overflow-y-auto space-y-2 border border-slate-800 shadow-inner">
            {activityStream.map((item, idx) => (
              <div key={idx} className="leading-relaxed">
                <span className="text-slate-500 font-bold mr-1.5">{item.time || item.text.substring(0, 10)}</span>
                <span className={
                  item.severity === 'CRITICAL' ? 'text-red-400 font-semibold' :
                  item.severity === 'HIGH' ? 'text-amber-400 font-semibold' :
                  'text-purple-300'
                }>
                  {item.text || item.message}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Buffer: 50 events</span>
            <span className="text-emerald-600 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-time Ingestion</span>
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Filter Bar & Attack Stream Table */}
      <GlassCard className="p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search IP, Attack Type, or Protocol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/70 border border-transparent text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-purple-200 focus:outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-purple-300"
            >
              <option value="">All Services</option>
              <option value="SSH">SSH (:2222)</option>
              <option value="HTTP">HTTP (:8080)</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-purple-300"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* Attacks Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3 pl-2">Time</th>
                <th className="pb-3">Source IP</th>
                <th className="pb-3">Service</th>
                <th className="pb-3">Attack Type</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Threat Score</th>
                <th className="pb-3">Mode</th>
                <th className="pb-3 pr-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAttacks.map((atk) => (
                <tr key={atk.id} className="hover:bg-purple-50/50 transition-colors">
                  <td className="py-3 pl-2 text-slate-500 font-mono">
                    {new Date(atk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-3 font-mono font-bold text-slate-800">{atk.source_ip}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100/70 text-purple-700 font-semibold text-[11px]">
                      {atk.service}
                    </span>
                  </td>
                  <td className="py-3 text-slate-800 font-semibold">{atk.attack_type}</td>
                  <td className="py-3">
                    <ThreatBadge severity={atk.severity} />
                  </td>
                  <td className="py-3 font-bold text-slate-700">
                    <span className={atk.threat_score >= 80 ? 'text-red-600 font-extrabold' : atk.threat_score >= 60 ? 'text-amber-600 font-bold' : 'text-purple-700'}>
                      {atk.threat_score}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      atk.mode === 'LIVE' ? 'bg-emerald-100 text-emerald-700' :
                      atk.mode === 'LAB' ? 'bg-amber-100 text-amber-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {atk.mode || 'LIVE'}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <Link
                      to={`/attacks/${atk.id}`}
                      className="inline-flex items-center px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
