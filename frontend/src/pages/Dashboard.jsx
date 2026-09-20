import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MetricCard from '../components/common/MetricCard';
import GlassCard from '../components/common/GlassCard';
import ThreatBadge from '../components/common/ThreatBadge';
import ThreatGlobe from '../components/3d/ThreatGlobe';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import {
  ShieldAlert,
  Zap,
  AlertTriangle,
  Lock,
  ArrowRight,
  TrendingUp,
  Globe,
  Radio
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { latestAttack, isConnected } = useWebSocket();

  useEffect(() => {
    fetchStats();
  }, []);

  // React to incoming live attacks via WebSocket to increment counters dynamically
  useEffect(() => {
    if (latestAttack && stats) {
      setStats(prev => {
        if (!prev) return prev;
        const isCrit = latestAttack.severity === 'CRITICAL';
        return {
          ...prev,
          total_attacks: prev.total_attacks + 1,
          critical_threats: isCrit ? prev.critical_threats + 1 : prev.critical_threats,
          recent_attacks: [latestAttack, ...(prev.recent_attacks || []).slice(0, 9)],
          severity_distribution: {
            ...prev.severity_distribution,
            total: prev.severity_distribution.total + 1,
            critical: isCrit ? prev.severity_distribution.critical + 1 : prev.severity_distribution.critical,
            high: latestAttack.severity === 'HIGH' ? prev.severity_distribution.high + 1 : prev.severity_distribution.high
          }
        };
      });
    }
  }, [latestAttack]);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const donutColors = ['#ef4444', '#f59e0b', '#8b5cf6', '#10b981'];

  const severityPieData = stats ? [
    { name: 'Critical', value: stats.severity_distribution.critical || 14 },
    { name: 'High', value: stats.severity_distribution.high || 32 },
    { name: 'Medium', value: stats.severity_distribution.medium || 56 },
    { name: 'Low', value: stats.severity_distribution.low || 25 },
  ] : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Atmospheric Skyline Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/90 via-indigo-900/95 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-purple-900/10 border border-purple-800/40">
        {/* Mountain Skyline Silhouette Vector in background */}
        <div className="absolute inset-0 pointer-events-none opacity-15 flex items-end">
          <svg className="w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,120 L0,75 L120,40 L260,95 L380,20 L520,80 L680,35 L820,70 L980,15 L1120,65 L1200,45 L1200,120 Z" fill="#c4b5fd" />
            <path d="M0,120 L0,90 L180,60 L340,105 L480,45 L620,90 L780,50 L920,85 L1060,35 L1200,75 L1200,120 Z" fill="#ffffff" opacity="0.5" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-[11px] font-bold text-purple-200 uppercase tracking-wider backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Turn Attacks into Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Security Overview
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/80">
              Real-time threat telemetry, autonomous honeypot deception states & incident orchestration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-purple-100 shadow-inner">
              <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>Live Ingress: {isConnected ? 'STREAMING' : 'POLLING'}</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-500/20 backdrop-blur-md border border-purple-400/20 text-xs font-semibold text-purple-200">
              <Globe className="w-3.5 h-3.5 text-purple-300" />
              <span>Frankfurt Hub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Attacks"
          value={stats?.total_attacks ?? 127}
          icon={Zap}
          delta="+12%"
          color="purple"
        />
        <MetricCard
          title="Critical Threats"
          value={stats?.critical_threats ?? 14}
          icon={ShieldAlert}
          delta="+27%"
          color="red"
        />
        <MetricCard
          title="Open Incidents"
          value={stats?.open_incidents ?? 23}
          icon={AlertTriangle}
          delta="+5%"
          color="amber"
        />
        <MetricCard
          title="Blocked IPs"
          value={stats?.blocked_ips ?? 41}
          icon={Lock}
          delta="+18%"
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attack Activity Area Chart */}
        <GlassCard className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Attack Activity</h3>
              <p className="text-xs text-slate-400">Temporal inbound probes across isolated sensor protocols</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <span className="flex items-center space-x-1.5 text-purple-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>SSH</span>
              </span>
              <span className="flex items-center space-x-1.5 text-indigo-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span>HTTP</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.activity_chart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sshGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="httpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #ede9fe',
                    boxShadow: '0 8px 24px rgba(109, 40, 217, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="ssh" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#sshGrad)" />
                <Area type="monotone" dataKey="http" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#httpGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Severity Distribution Donut Chart */}
        <GlassCard className="lg:col-span-4 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Severity Distribution</h3>
            <p className="text-xs text-slate-400">Classified by Threat Scoring Engine</p>
          </div>

          <div className="relative h-48 my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Total Counter */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-honey-indigo">
                {stats?.total_attacks ?? 127}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Total
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-medium">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-slate-600">Critical: <strong>{stats?.severity_distribution.critical || 14}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">High: <strong>{stats?.severity_distribution.high || 32}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-600">Medium: <strong>{stats?.severity_distribution.medium || 56}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Low: <strong>{stats?.severity_distribution.low || 25}</strong></span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row: Recent Attacks Table + 3D Threat Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Attacks Table */}
        <GlassCard className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Recent Attacks</h3>
              <p className="text-xs text-slate-400">Real-time incoming telemetry stream</p>
            </div>
            <Link
              to="/attacks"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                  <th className="pb-3 pl-2">Time</th>
                  <th className="pb-3">Source IP</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Attack Type</th>
                  <th className="pb-3">Severity</th>
                  <th className="pb-3 pr-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(stats?.recent_attacks || []).slice(0, 6).map((atk) => (
                  <tr key={atk.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-3 pl-2 text-slate-500 font-mono">
                      {new Date(atk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 font-mono text-slate-700 font-semibold">{atk.source_ip}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {atk.service}
                      </span>
                    </td>
                    <td className="py-3 text-slate-800 font-semibold">{atk.attack_type}</td>
                    <td className="py-3">
                      <ThreatBadge severity={atk.severity} />
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <Link
                        to={`/attacks/${atk.id}`}
                        className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline"
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

        {/* Global Threat Map preview */}
        <GlassCard className="lg:col-span-4 p-6 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">Global Threat Map</h3>
              <p className="text-xs text-slate-400">Live ballistic attack origins</p>
            </div>
            <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              17 active
            </span>
          </div>

          <ThreatGlobe className="h-[250px] w-full" />

          {/* Severity Classification Legend */}
          <div className="grid grid-cols-4 gap-1.5 py-2 px-2.5 rounded-xl bg-purple-50/70 border border-purple-100/80 text-[10px] font-bold text-slate-600 my-2">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-xs" />
              <span>Crit</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" />
              <span>High</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-xs" />
              <span>Med</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
              <span>Low</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Top Origins</div>
            <div className="space-y-1.5 text-xs">
              {(stats?.top_countries || []).slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-800">{c.country}</span>
                  </span>
                  <span className="font-semibold text-purple-700">{c.percentage}%</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Primary Sensor:</span>
              <span className="font-bold text-honey-indigo">Frankfurt, DE</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
