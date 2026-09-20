import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { api } from '../services/api';
import {
  Network,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

export default function Mitre() {
  const [techniques, setTechniques] = useState([]);
  const [matrixData, setMatrixData] = useState(null);
  const [selectedTech, setSelectedTech] = useState(null);
  const [drilldownData, setDrilldownData] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getMitreTechniques({ search }),
      api.getMitreMatrix()
    ]).then(([techs, matrix]) => {
      setTechniques(techs);
      setMatrixData(matrix);
    }).finally(() => setLoading(false));
  }, [search]);

  const handleSelectTechnique = async (techId) => {
    try {
      const data = await api.getMitreTechniqueDrilldown(techId);
      setDrilldownData(data);
      setSelectedTech(techId);
    } catch (err) {
      console.error("Failed to load technique details:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-honey-indigo tracking-tight">MITRE ATT&CK Matrix</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Correlating observed honeypot interactions with adversary tradecraft</p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter observed techniques or tactics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
        />
      </div>

      {/* Interactive Matrix Columns */}
      {matrixData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {matrixData.tactics.map((tactic) => {
            const techsInTactic = matrixData.matrix[tactic] || [];
            if (techsInTactic.length === 0) return null;

            return (
              <GlassCard key={tactic} className="p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700">{tactic}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      {techsInTactic.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {techsInTactic.map((tech) => (
                      <button
                        key={tech.id}
                        onClick={() => handleSelectTechnique(tech.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          selectedTech === tech.id
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                            : 'bg-white/80 border-slate-200/80 hover:bg-purple-50 hover:border-purple-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-xs font-bold ${selectedTech === tech.id ? 'text-purple-200' : 'text-purple-700'}`}>
                            {tech.id}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            selectedTech === tech.id ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {tech.observed_count} observed
                          </span>
                        </div>
                        <div className="text-xs font-semibold mt-1 line-clamp-1">{tech.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Technique Drilldown Drawer / Card */}
      {drilldownData && (
        <GlassCard className="p-6 border-purple-300 shadow-2xl animate-fadeIn space-y-4">
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <div className="flex items-center space-x-3">
                <span className="font-mono text-lg font-black text-purple-700">{drilldownData.technique.id}</span>
                <span className="text-lg font-bold text-slate-800">{drilldownData.technique.name}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                  {drilldownData.technique.tactic}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed">
                {drilldownData.technique.description}
              </p>
            </div>
            {drilldownData.technique.reference_url && (
              <a
                href={drilldownData.technique.reference_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-xs font-semibold text-purple-600 hover:underline"
              >
                <span>MITRE Spec</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Associated Honeypot Inbound Attacks ({drilldownData.associated_attacks.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {drilldownData.associated_attacks.map((atk, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{atk.source_ip}</span>
                    <span className="text-slate-400 block text-[11px]">{atk.service} • {atk.attack_type}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-purple-700">Score: {atk.threat_score}</span>
                    <span className="block text-[10px] text-slate-400">{new Date(atk.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
