import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HoneycombCore from '../components/3d/HoneycombCore';
import GlassCard from '../components/common/GlassCard';
import {
  Shield,
  Zap,
  Cpu,
  Globe,
  Sliders,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Play,
  Layers,
  Activity,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const [adaptiveStep, setAdaptiveStep] = useState(2);

  const adaptiveLevels = [
    {
      level: "LOW",
      title: "Standard Emulation",
      color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
      desc: "Generic OpenSSH / Nginx banners. Low interaction, basic 404/401 HTTP codes. Minimum footprint."
    },
    {
      level: "MEDIUM",
      title: "Heuristic Decoy",
      color: "text-purple-600 bg-purple-500/10 border-purple-500/20",
      desc: "Realistic fake administrative login interfaces, simulated session keepalive, detailed command responses."
    },
    {
      level: "HIGH",
      title: "Deep Deception",
      color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
      desc: "Simulated vulnerable services, lure filesystem (/var/www/backup.sql, /etc/shadow dummy entries), honeytoken artifacts."
    },
    {
      level: "CRITICAL",
      title: "Active Containment & Trap",
      color: "text-red-600 bg-red-500/10 border-red-500/20",
      desc: "High-interaction labyrinth, infinite tar-pit delay, honeytokens with canary triggers, rate-limited tarpit."
    }
  ];

  return (
    <div className="min-h-screen bg-honey-bg text-honey-text">
      {/* Home Navigation */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <img
            src="/assets/logo.png"
            alt="HoneyGuard"
            className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
          />
          <div>
            <span className="text-xl font-extrabold text-honey-indigo tracking-tight">HoneyGuard</span>
            <span className="block text-[9px] font-bold text-purple-600 tracking-wider uppercase">Cyber Intelligence Platform</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600">
          <a href="#how-it-works" className="hover:text-purple-600 transition-colors">How It Works</a>
          <a href="#capabilities" className="hover:text-purple-600 transition-colors">Capabilities</a>
          <a href="#architecture" className="hover:text-purple-600 transition-colors">Architecture</a>
          <a href="#adaptive" className="hover:text-purple-600 transition-colors">Adaptive Deception</a>
        </nav>

        <Link
          to="/dashboard"
          className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-lg shadow-purple-600/25 transition-all transform hover:-translate-y-0.5"
        >
          <span>Enter HoneyGuard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-100/70 border border-purple-200/60 text-purple-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI FOR A SAFER TOMORROW</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-honey-indigo tracking-tight leading-[1.12]">
              HoneyGuard <br />
              <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 bg-clip-text text-transparent">
                AI-Powered Adaptive Honeypot Platform
              </span>
            </h1>

            <p className="text-base text-slate-600 max-w-xl font-normal leading-relaxed">
              <strong className="text-purple-700 font-semibold">Detect. Deceive. Analyze. Respond.</strong> HoneyGuard captures attacker interactions through isolated SSH and HTTP honeypots, analyzes telemetry using ML, enriches with real-time threat intelligence, maps to MITRE ATT&CK, and automates SOAR incident response.
            </p>

            <div className="flex items-center space-x-4 pt-2">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-7 py-3 rounded-full bg-honey-indigo hover:bg-purple-900 text-white font-semibold text-sm shadow-xl shadow-purple-900/20 transition-all transform hover:-translate-y-0.5"
              >
                <span>Enter HoneyGuard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-white/80 hover:bg-white text-slate-700 font-semibold text-sm border border-purple-200/70 shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current text-purple-600" />
                <span>See How It Works</span>
              </a>
            </div>

            {/* Quick Metrics Banner */}
            <div className="pt-8 border-t border-slate-200/60 grid grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-black text-honey-indigo">127</div>
                <div className="text-[11px] font-medium text-slate-500">Attacks Detected</div>
              </div>
              <div>
                <div className="text-2xl font-black text-honey-indigo">23</div>
                <div className="text-[11px] font-medium text-slate-500">Incidents Created</div>
              </div>
              <div>
                <div className="text-2xl font-black text-honey-indigo">41</div>
                <div className="text-[11px] font-medium text-slate-500">Blocked IPs</div>
              </div>
              <div>
                <div className="text-2xl font-black text-honey-indigo">99.7%</div>
                <div className="text-[11px] font-medium text-slate-500">System Uptime</div>
              </div>
            </div>
          </div>

          {/* Hero Right 3D Visual */}
          <div className="lg:col-span-6 relative">
            <HoneycombCore className="h-[460px] w-full" />
            
            {/* Floating Live Threats Glass Badge */}
            <div className="absolute top-10 right-4 p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-white shadow-xl max-w-xs space-y-1.5 pointer-events-none">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>Live Threats Monitored</span>
              </div>
              <div className="text-[11px] text-slate-500">
                • 17 Active Attacks<br />
                • 6 Critical Threats<br />
                • 23 Blocked IPs
              </div>
            </div>

            {/* Floating Tagline Card */}
            <div className="absolute bottom-6 left-4 p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white shadow-xl text-xs font-bold text-purple-800 pointer-events-none">
              "Turning Attacks into Intelligence"
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="capabilities" className="py-20 bg-white/50 border-y border-purple-100/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">The Architectural Paradigm Shift</h2>
            <h3 className="text-3xl font-extrabold text-honey-indigo">Why Conventional Honeypots Fail</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Conventional */}
            <GlassCard className="p-8 border-red-200/60 bg-red-50/20">
              <div className="flex items-center space-x-3 mb-4 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="text-lg font-bold">Conventional Static Honeypots</h4>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Static Emulation:</strong> Attackers quickly fingerprint predictable canned responses.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Raw Unstructured Logs:</strong> Millions of lines requiring tedious manual triage.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>No Contextual Enrichment:</strong> Zero threat intelligence or geolocation correlation.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold">•</span>
                  <span><strong>Passive Defense:</strong> No automated containment or dynamic adaptation.</span>
                </li>
              </ul>
            </GlassCard>

            {/* HoneyGuard */}
            <GlassCard className="p-8 border-purple-300 bg-purple-50/20 shadow-xl">
              <div className="flex items-center space-x-3 mb-4 text-purple-700">
                <CheckCircle className="w-6 h-6" />
                <h4 className="text-lg font-bold">HoneyGuard AI Autonomous Platform</h4>
              </div>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span><strong>Adaptive Deception:</strong> Honeypot automatically elevates deception depth as threat intensity scales.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span><strong>ML Classification:</strong> Real-time feature extraction and classification into MITRE ATT&CK tactics.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span><strong>Threat Intelligence:</strong> Instant IP reputation, ASN, and geographic enrichment.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-600 font-bold">✓</span>
                  <span><strong>Autonomous SOAR:</strong> Automated incident response, containment logging, and analyst alerts.</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* How It Works Pipeline */}
      <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Automated Threat Pipeline</h2>
          <h3 className="text-3xl font-extrabold text-honey-indigo">From Intrusion to Containment in Milliseconds</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "01", icon: Shield, title: "Trap & Capture", desc: "Isolated SSH & HTTP sensors capture unsolicited payloads, credentials, and telemetry safely." },
            { step: "02", icon: Cpu, title: "ML Behavior Analysis", desc: "Features extracted and evaluated by Random Forest classifier to detect brute-force, SQLi, and probes." },
            { step: "03", icon: Globe, title: "Enrich & Map", desc: "Automated IP reputation retrieval, ASN/ISP lookup, and correlation to MITRE ATT&CK techniques." },
            { step: "04", icon: Zap, title: "Adapt & Respond", desc: "Explainable threat scoring triggers dynamic deception escalation and SOAR containment playbooks." },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <GlassCard key={idx} className="p-6 relative group hover:-translate-y-1">
                <div className="text-3xl font-black text-purple-200 group-hover:text-purple-300 transition-colors">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100/70 text-purple-600 flex items-center justify-center my-4 shadow-sm">
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-2">{item.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Adaptive Deception Showcase */}
      <section id="adaptive" className="py-20 bg-gradient-to-b from-purple-50/40 via-white to-purple-50/30 border-y border-purple-100/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Dynamic Deception Engine</h2>
            <h3 className="text-3xl font-extrabold text-honey-indigo">Adaptive Honeypot Tiers</h3>
            <p className="text-sm text-slate-500 mt-2">
              As attacker persistence escalates, HoneyGuard dynamically deepens decoy interaction without ever putting the host OS at risk.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {/* Tier Selector Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {adaptiveLevels.map((lvl, idx) => (
                <button
                  key={lvl.level}
                  onClick={() => setAdaptiveStep(idx)}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                    adaptiveStep === idx
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/25 scale-[1.02]'
                      : 'bg-white/80 text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {lvl.level}
                </button>
              ))}
            </div>

            {/* Active Tier Card */}
            <GlassCard className="p-8 border-purple-200/90 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${adaptiveLevels[adaptiveStep].color}`}>
                  DECEPTION TIER: {adaptiveLevels[adaptiveStep].level}
                </span>
                <span className="text-xs font-semibold text-slate-400">Step {adaptiveStep + 1} of 4</span>
              </div>
              <h4 className="text-2xl font-bold text-slate-800 mb-3">{adaptiveLevels[adaptiveStep].title}</h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">{adaptiveLevels[adaptiveStep].desc}</p>
              
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto">
                {adaptiveStep === 0 && (
                  <div>
                    <span className="text-emerald-400"># Emulation Profile: LOW</span><br />
                    $ curl -I http://honeynet.local:8080/admin<br />
                    HTTP/1.1 404 Not Found<br />
                    Server: nginx/1.18.0
                  </div>
                )}
                {adaptiveStep === 1 && (
                  <div>
                    <span className="text-purple-400"># Emulation Profile: MEDIUM</span><br />
                    $ ssh analyst@honeynet.local -p 2222<br />
                    SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.6<br />
                    Password authentication prompt rendered | Rate limited
                  </div>
                )}
                {adaptiveStep === 2 && (
                  <div>
                    <span className="text-amber-400"># Emulation Profile: HIGH</span><br />
                    $ curl http://honeynet.local:8080/actuator/health<br />
                    HTTP/1.1 200 OK<br />
                    {`{"status":"UP","debug":{"backup_uri":"/var/backup/latest_dump.sql"}}`}
                  </div>
                )}
                {adaptiveStep === 3 && (
                  <div>
                    <span className="text-red-400"># Emulation Profile: CRITICAL</span><br />
                    # Canary Honeytoken triggered!<br />
                    # Simulated IP Quarantine applied<br />
                    # Incident created autonomously
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Architecture Showcase */}
      <section id="architecture" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Technical Architecture</h2>
          <h3 className="text-3xl font-extrabold text-honey-indigo">Integrated 9-Route Cybersecurity Suite</h3>
        </div>

        <GlassCard className="p-8 border-purple-200/70 overflow-hidden">
          <img
            src="/assets/architecture.png"
            alt="HoneyGuard Architecture"
            className="w-full max-h-[500px] object-contain rounded-xl mx-auto"
          />
        </GlassCard>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 text-center bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-6">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Turn Attacker Activity into Actionable Intelligence.
          </h3>
          <p className="text-sm sm:text-base text-purple-200 max-w-xl mx-auto">
            Explore live attacks, autonomous incidents, explainable threat scoring, and automated SOAR containment playbooks.
          </p>
          <div className="pt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-full bg-white hover:bg-purple-50 text-honey-indigo font-bold text-sm shadow-2xl transition-all transform hover:-translate-y-0.5"
            >
              <span>ENTER HONEYGUARD</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
