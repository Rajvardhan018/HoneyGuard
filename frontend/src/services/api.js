const getApiBase = () => {
  let raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (!raw) {
    return '/api/v1';
  }
  raw = raw.replace(/\/api\/v1$/, '').replace(/\/v1$/, '').replace(/\/api$/, '');
  return `${raw}/api/v1`;
};

const API_BASE = getApiBase();

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('hg_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Request failed: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getProfile: () => request('/auth/me'),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),
  getSystemHealth: () => request('/dashboard/health'),

  // Honeypots
  getHoneypots: () => request('/honeypots/'),
  getHoneypot: (id) => request(`/honeypots/${id}`),
  createHoneypot: (data) =>
    request('/honeypots/', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  performHoneypotAction: (id, action, deceptionLevel) =>
    request(`/honeypots/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, deception_level: deceptionLevel })
    }),
  getHoneypotSessions: (id) => request(`/honeypots/${id}/sessions`),

  // Attacks
  getAttacks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attacks/${query ? `?${query}` : ''}`);
  },
  getAttackDetails: (id) => request(`/attacks/${id}`),

  // Threat Intel
  getThreatIntelList: (search = '') =>
    request(`/threat-intelligence/${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  lookupIp: (ip) => request(`/threat-intelligence/lookup/${encodeURIComponent(ip)}`),

  // MITRE
  getMitreTechniques: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/mitre/techniques${query ? `?${query}` : ''}`);
  },
  getMitreTechniqueDrilldown: (id) => request(`/mitre/techniques/${id}`),
  getMitreMatrix: () => request('/mitre/matrix'),

  // Incidents
  getIncidents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/incidents/${query ? `?${query}` : ''}`);
  },
  getIncident: (id) => request(`/incidents/${id}`),
  updateIncident: (id, updates) =>
    request(`/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  // SOAR
  getPlaybooks: () => request('/response/playbooks'),
  getExecutions: () => request('/response/executions'),
  getBlocklist: () => request('/response/blocklist'),
  simulatePlaybook: (id, targetIp, threatScore) =>
    request(`/response/playbooks/${id}/simulate?target_ip=${encodeURIComponent(targetIp)}&threat_score=${threatScore}`, {
      method: 'POST'
    }),

  // Lab & Replay
  getSystemMode: () => request('/lab/mode'),
  setSystemMode: (mode) => request(`/lab/mode/${mode}`, { method: 'POST' }),
  triggerLabAttack: (attackData) =>
    request('/lab/attack', { method: 'POST', body: JSON.stringify(attackData) }),
  triggerReplay: () => request('/lab/replay', { method: 'POST' })
};
