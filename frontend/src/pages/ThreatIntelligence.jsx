import React, { useState, useEffect } from 'react';
import GlassCard from '../components/common/GlassCard';
import { api } from '../services/api';
import {
  Globe,
  Search,
  ShieldAlert,
  Info,
  ExternalLink,
  MapPin,
  Server,
  Activity
} from 'lucide-react';

export default function ThreatIntelligence() {
  const [intelList, setIntelList] = useState([]);
  const [search, setSearch] = useState('');
  const [manualIp, setManualIp] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    fetchIntel();
  }, [search]);

  const fetchIntel = async () => {
    try {
      const data = await api.getThreatIntelList(search);
      setIntelList(data);
    } catch (err) {
      console.error("Failed to load threat intel:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async (e) => {
    e.preventDefault();
    if (!manualIp.trim()) return;
    setLookupLoading(true);
    try {
      const res = await api.lookupIp(manualIp.trim());
      setLookupResult(res);
    } catch (err) {
      alert(`Lookup failed: ${err.message}`);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-honey-indigo tracking-tight">Threat Intelligence</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Automated reputation enrichment & IOC correlation</p>
      </div>

      {/* Manual IP Lookup Bar */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-1">Analyst Manual IP Investigation</h3>
        <p className="text-xs text-slate-500 mb-4">Query external IP reputation, ASN, abuse history, and local sensor sightings</p>
        
        <form onSubmit={handleManualLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Enter IPv4 or IPv6 address (e.g. 185.199.110.23, 192.168.1.1)..."
              value={manualIp}
              onChange={(e) => setManualIp(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
          <button
            type="submit"
            disabled={lookupLoading}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center justify-center space-x-2"
          >
            <Globe className="w-4 h-4" />
            <span>{lookupLoading ? "Enriching..." : "Enrich IP"}</span>
          </button>
        </form>

        {/* Lookup Result Modal/Drawer if present */}
        {lookupResult && (
          <div className="mt-5 p-4 rounded-xl bg-purple-50/60 border border-purple-200 animate-fadeIn space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-sm text-purple-950">{lookupResult.ip_address}</span>
              {lookupResult.is_private ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                  RFC 1918 PRIVATE
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                  Abuse Score: {lookupResult.abuse_confidence_score}%
                </span>
              )}
            </div>

            {lookupResult.is_private ? (
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs flex items-center space-x-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>External reputation unavailable for private address (Lab / Sensor subnet).</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Location</span>
                  <span className="font-bold text-slate-800">{lookupResult.country_name} ({lookupResult.country_code})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ASN</span>
                  <span className="font-mono font-semibold text-purple-700">{lookupResult.asn}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">ISP</span>
                  <span className="font-semibold text-slate-800 truncate block">{lookupResult.isp}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Known Reports</span>
                  <span className="font-bold text-red-600">{lookupResult.known_reports_count} reports</span>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Threat Intel Records Table */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Enriched Threat Indicator Feed</h3>
          <span className="text-xs text-slate-400 font-medium">{intelList.length} indicators indexed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="pb-3 pl-2">IP Address</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">ASN / ISP</th>
                <th className="pb-3">Reputation</th>
                <th className="pb-3">Abuse Confidence</th>
                <th className="pb-3">HoneyGuard Sightings</th>
                <th className="pb-3 pr-2">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {intelList.map((item) => (
                <tr key={item.ip_address} className="hover:bg-purple-50/40 transition-colors">
                  <td className="py-3.5 pl-2 font-mono font-bold text-slate-800">{item.ip_address}</td>
                  <td className="py-3.5">
                    {item.is_private ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        Private
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                        Public Sensor
                      </span>
                    )}
                  </td>
                  <td className="py-3.5">
                    <span className="font-semibold text-slate-800">{item.country_name}</span>
                    <span className="block text-[10px] text-slate-400">{item.city}</span>
                  </td>
                  <td className="py-3.5">
                    <span className="font-mono text-purple-700 block font-semibold">{item.asn}</span>
                    <span className="text-[10px] text-slate-500 truncate block max-w-[150px]">{item.isp}</span>
                  </td>
                  <td className="py-3.5 font-bold">
                    <span className={item.reputation_score >= 70 ? 'text-red-600' : 'text-slate-700'}>
                      {item.reputation_score}/100
                    </span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${item.abuse_confidence_score}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-red-600 font-mono">
                        {item.abuse_confidence_score}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 font-bold text-purple-700 text-center">
                    {item.local_sightings}
                  </td>
                  <td className="py-3.5 pr-2 text-slate-400 text-[11px]">
                    {new Date(item.last_seen).toLocaleDateString()}
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
