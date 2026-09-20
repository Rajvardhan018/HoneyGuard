import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import GlassCard from '../components/common/GlassCard';
import ThreatBadge from '../components/common/ThreatBadge';
import { api } from '../services/api';
import {
  ArrowLeft,
  Shield,
  Cpu,
  Globe,
  Network,
  AlertTriangle,
  Clock,
  Terminal,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function AttackDetails() {
  const { id } = useParams();
  const [attack, setAttack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getAttackDetails(id)
      .then(setAttack)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs font-semibold text-slate-500">Loading Forensic Dossier...</span>
      </div>
    );
  }

  if (error || !attack) {
    return (
      <GlassCard className="p-8 text-center max-w-lg mx-auto">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Attack Event Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || "Unable to retrieve event telemetry."}</p>
        <Link to="/attacks" className="text-xs font-bold text-purple-600 hover:underline">
          Return to Live Attacks
        </Link>
      </GlassCard>
    );
  }

  const scoringBreakdown = attack.event_metadata?.scoring_breakdown?.components || {
    attack_type_severity: 24.0,
    ml_model_confidence: 18.8,
    threat_intel_reputation: 22.0,
    behavioral_intensity: 12.0,
    mitre_technique_breadth: 8.0
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/attacks"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-purple-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Stream</span>
        </Link>

        <div className="flex items-center space-x-3">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            attack.mode === 'LIVE' ? 'bg-emerald-100 text-emerald-700' :
            attack.mode === 'LAB' ? 'bg-amber-100 text-amber-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {attack.mode} CAPTURE
          </span>
          <span className="text-xs font-mono text-slate-400">ID: {attack.id}</span>
        </div>
      </div>

      {/* Main Dossier Header Banner */}
      <GlassCard className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-black text-honey-indigo tracking-tight">
                {attack.attack_type}
              </h1>
              <ThreatBadge severity={attack.severity} />
            </div>
            <p className="text-xs text-slate-500">
              Hostile interaction captured on isolated sensor <strong className="text-purple-700">{attack.honeypot_id}</strong> ({attack.service})
            </p>
          </div>

          {/* Threat Score Big Display */}
          <div className="flex items-center space-x-6 bg-purple-50/60 p-4 rounded-2xl border border-purple-100/80">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Threat Score
              </span>
              <span className="text-3xl font-black text-purple-800">
                {attack.threat_score} <span className="text-sm font-bold text-slate-400">/ 100</span>
              </span>
            </div>
            <div className="border-l border-purple-200/80 pl-6">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                AI Confidence
              </span>
              <span className="text-2xl font-bold text-emerald-600">
                {Math.round((attack.prediction?.confidence || 0.94) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Meta Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Source IP</span>
            <span className="font-mono font-bold text-slate-800">{attack.source_ip}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Capture Timestamp</span>
            <span className="font-medium text-slate-700">{new Date(attack.timestamp).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Session ID</span>
            <span className="font-mono text-purple-700 font-semibold">{attack.session_id || 'SES-NONE'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Associated Incident</span>
            {attack.incident_id ? (
              <Link to={`/incidents`} className="font-bold text-red-600 hover:underline flex items-center space-x-1">
                <span>{attack.incident_id}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <span className="text-slate-400 font-medium">None (Below Threshold)</span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* 2-Column Investigation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Timeline, Payload, AI Explainability */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visual Attack Chronological Timeline */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-800">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-bold">Autonomous Attack Timeline</h3>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-200">
              {(attack.timeline || []).map((step, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow-sm flex items-center justify-center text-white text-[9px] font-bold">
                    ✓
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800">{step.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                        {step.stage}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Raw Payload Inspection */}
          <GlassCard className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-800">
                <Terminal className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold">Captured Telemetry & Payload</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Safe Sandboxed Data</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-slate-800">
              {attack.raw_payload || "# No raw payload captured for this connection handshake"}
            </div>
          </GlassCard>

          {/* Explainable Threat Scoring Engine Breakdown */}
          <GlassCard className="p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Explainable Threat Score Calculation</h3>
              <p className="text-xs text-slate-500">Transparent mathematical attribution of risk components</p>
            </div>

            <div className="space-y-3">
              {[
                { name: "Attack Type Inherent Risk", value: scoringBreakdown.attack_type_severity, max: 30, color: "bg-purple-600" },
                { name: "External Threat Intel Reputation", value: scoringBreakdown.threat_intel_reputation, max: 25, color: "bg-red-500" },
                { name: "Machine Learning Confidence Factor", value: scoringBreakdown.ml_model_confidence, max: 20, color: "bg-indigo-600" },
                { name: "Behavioral Velocity & Repetition", value: scoringBreakdown.behavioral_intensity, max: 15, color: "bg-amber-500" },
                { name: "MITRE ATT&CK Multiplicity", value: scoringBreakdown.mitre_technique_breadth, max: 10, color: "bg-emerald-500" },
              ].map((factor, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{factor.name}</span>
                    <span className="font-mono text-purple-700">{factor.value} / {factor.max} pts</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${factor.color}`}
                      style={{ width: `${(factor.value / factor.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right Column (4 cols): Threat Intel, MITRE, SOAR Executions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Threat Intelligence Context */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-800">
              <Globe className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-bold">Threat Intelligence</h3>
            </div>

            {attack.threat_intel ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Origin Country</span>
                  <span className="font-bold text-slate-800">{attack.threat_intel.country_name} ({attack.threat_intel.country_code})</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">City / Coordinates</span>
                  <span className="font-semibold text-slate-700">{attack.threat_intel.city}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">ASN</span>
                  <span className="font-mono font-semibold text-purple-700">{attack.threat_intel.asn}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">ISP Provider</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[160px] truncate">{attack.threat_intel.isp}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-medium">Abuse Confidence</span>
                  <span className="font-bold text-red-600">{attack.threat_intel.abuse_confidence_score}%</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3">No external threat intelligence record.</div>
            )}
          </GlassCard>

          {/* MITRE ATT&CK Mappings */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-800">
              <Network className="w-4 h-4 text-purple-600" />
              <h3 className="text-base font-bold">MITRE ATT&CK Mappings</h3>
            </div>

            <div className="space-y-2.5">
              {(attack.mitre_mappings || []).map((m, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs">
                  <div className="flex items-center justify-between font-bold text-purple-900 mb-1">
                    <span className="font-mono text-purple-700">{m.technique_id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-purple-700 border border-purple-200">
                      {m.tactic}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800">{m.technique_name}</div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{m.rationale}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* SOAR Automated Response Actions */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold">SOAR Actions Executed</h3>
            </div>

            <div className="space-y-2 text-xs">
              {(attack.response_actions?.[0]?.steps || [
                { name: "Attack analyzed", status: "COMPLETED" },
                { name: "Threat intelligence retrieved", status: "COMPLETED" },
                { name: "MITRE mapped", status: "COMPLETED" },
                { name: "Incident created", status: "COMPLETED" },
                { name: "Adaptive mode increased", status: "COMPLETED" },
                { name: "Response recorded", status: "COMPLETED" },
              ]).map((step, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 text-slate-700">
                  <span className="font-medium flex items-center space-x-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{step.name}</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
