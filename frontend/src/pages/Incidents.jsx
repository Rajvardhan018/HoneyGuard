import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import ThreatBadge from '../components/common/ThreatBadge';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  ShieldAlert,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const fetchIncidents = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await api.getIncidents(params);
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      }
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (incId, newStatus) => {
    try {
      const updated = await api.updateIncident(incId, { status: newStatus });
      if (newStatus === 'RESOLVED') {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      }
      setSelectedIncident(updated);
      await fetchIncidents();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedIncident) return;
    try {
      const updated = await api.updateIncident(selectedIncident.id, { notes: noteText });
      setSelectedIncident(updated);
      setNoteText('');
      await fetchIncidents();
    } catch (err) {
      alert(`Failed to add note: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-honey-indigo tracking-tight">Incident Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Autonomous case management & SOAR containment records</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2">
          {['', 'OPEN', 'INVESTIGATING', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st || 'All Cases'}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Split: Incidents List (5 cols) & Active Case Dossier (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Incident Cards List */}
        <div className="lg:col-span-5 space-y-3">
          {incidents.length === 0 ? (
            <GlassCard className="p-8 text-center text-xs text-slate-400">
              No incidents match this status filter.
            </GlassCard>
          ) : (
            incidents.map((inc) => (
              <GlassCard
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 border transition-all ${
                  selectedIncident?.id === inc.id
                    ? 'border-purple-500 bg-purple-50/40 shadow-md'
                    : 'border-white/90 hover:border-purple-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-purple-700">{inc.id}</span>
                      <ThreatBadge severity={inc.severity} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{inc.title}</h4>
                    <div className="text-[11px] text-slate-500 font-mono">Target: {inc.source_ip}</div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    inc.status === 'OPEN' ? 'bg-red-100 text-red-700' :
                    inc.status === 'INVESTIGATING' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {inc.status}
                  </span>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Selected Incident Detail View */}
        {selectedIncident && (
          <GlassCard className="lg:col-span-7 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <span className="font-mono text-base font-black text-purple-700">{selectedIncident.id}</span>
                  <ThreatBadge severity={selectedIncident.severity} />
                  <span className="text-xs font-bold text-slate-400">Threat Score: {selectedIncident.threat_score}</span>
                </div>
                <h2 className="text-lg font-bold text-honey-indigo">{selectedIncident.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedIncident.summary}</p>
              </div>

              {/* Status Selector */}
              <div className="flex items-center space-x-1.5 self-start">
                {['OPEN', 'INVESTIGATING', 'RESOLVED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedIncident.id, st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      selectedIncident.status === st
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Case Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Adversary IP</span>
                <span className="font-mono font-bold text-slate-800">{selectedIncident.source_ip}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Attack Type</span>
                <span className="font-semibold text-slate-800">{selectedIncident.attack_type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assigned Analyst</span>
                <span className="font-semibold text-purple-700">{selectedIncident.assigned_analyst}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Created At</span>
                <span className="text-slate-600">{new Date(selectedIncident.created_at).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Timeline of Events */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Incident Action Timeline</span>
              </h3>

              <div className="space-y-3 pl-4 border-l-2 border-purple-100">
                {(selectedIncident.events || []).map((ev) => (
                  <div key={ev.id} className="relative pl-3">
                    <span className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {ev.event_type}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString()} by <strong>{ev.performed_by}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 font-medium">{ev.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Analyst Note */}
            <form onSubmit={handleAddNote} className="pt-4 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Add analyst investigation note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors"
              >
                Add Note
              </button>
            </form>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
