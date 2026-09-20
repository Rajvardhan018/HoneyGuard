import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  X,
  Server,
  Plus,
  Radio,
  AlertCircle,
  Cpu
} from 'lucide-react';

export default function AddHoneypotModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('ssh');
  const [port, setPort] = useState(2223);
  const [description, setDescription] = useState('');
  const [deceptionLevel, setDeceptionLevel] = useState('MEDIUM');
  const [deploymentMode, setDeploymentMode] = useState('LAB');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'ssh' && (port === 8081 || port === 8080)) {
      setPort(2223);
    } else if (newType === 'http' && (port === 2223 || port === 2222)) {
      setPort(8081);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Please enter a honeypot sensor name.");
      return;
    }

    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
      setErrorMsg("Port must be a valid number between 1024 and 65535.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        type: type.toLowerCase(),
        port: portNum,
        description: description.trim() || `${deploymentMode} ${type.toUpperCase()} Decoy Sensor`,
        deception_level: deceptionLevel,
        deployment_mode: deploymentMode
      };

      const createdHp = await api.createHoneypot(payload);
      onCreated?.(createdHp);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || "Failed to create honeypot sensor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 via-white to-purple-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-honey-indigo text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Add New Honeypot Sensor</h3>
              <p className="text-xs text-slate-500">Deploy a local academic decoy or register isolated sensor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Deployment Mode (LAB vs LIVE) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
              Deployment Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeploymentMode('LAB')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-left flex items-center space-x-2 ${
                  deploymentMode === 'LAB'
                    ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <div>
                  <span className="block text-xs">LAB Mode</span>
                  <span className="block text-[10px] text-slate-400 font-normal">Local Sandbox Simulation</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDeploymentMode('LIVE')}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-left flex items-center space-x-2 ${
                  deploymentMode === 'LIVE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <div>
                  <span className="block text-xs">LIVE Mode</span>
                  <span className="block text-[10px] text-slate-400 font-normal">Isolated Live Listener</span>
                </div>
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {deploymentMode === 'LAB'
                ? '✦ LAB spawns an isolated sandboxed python listener locally on your chosen port.'
                : '✦ LIVE verifies an active isolated sensor daemon listening on the target port.'}
            </p>
          </div>

          {/* Honeypot Name & Service Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Honeypot Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'ssh' ? 'SSH-LAB-02' : 'HTTP-LAB-02'}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/20 font-medium text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Protocol Service *</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTypeChange('ssh')}
                  className={`py-2 rounded-xl font-bold border text-center transition-all ${
                    type === 'ssh'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  SSH
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('http')}
                  className={`py-2 rounded-xl font-bold border text-center transition-all ${
                    type === 'http'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  HTTP
                </button>
              </div>
            </div>
          </div>

          {/* Port & Deception Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Listening Port *</label>
              <input
                type="number"
                min="1024"
                max="65535"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/20 font-mono font-bold text-slate-800"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Suggested: 2223 (SSH), 8081 (HTTP)</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Deception Tier</label>
              <select
                value={deceptionLevel}
                onChange={(e) => setDeceptionLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/20 font-bold text-slate-800"
              >
                <option value="LOW">LOW (Banner / Basic 404)</option>
                <option value="MEDIUM">MEDIUM (Simulated Gateway / Form)</option>
                <option value="HIGH">HIGH (Fake API / Lure Dumps)</option>
                <option value="CRITICAL">CRITICAL (Canary Honeytokens)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows="2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Academic evaluation honeypot for tracking credential dictionary probes..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/20 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-honey-indigo hover:bg-purple-900 text-white font-bold shadow-md shadow-purple-900/20 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Deploy Honeypot</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
