import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import StatusIndicator from '../common/StatusIndicator';
import {
  LayoutDashboard,
  Server,
  Zap,
  Globe,
  Network,
  AlertTriangle,
  Cpu,
  Home
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Honeypots', path: '/honeypots', icon: Server },
  { name: 'Live Attacks', path: '/attacks', icon: Zap },
  { name: 'Threat Intelligence', path: '/threat-intelligence', icon: Globe },
  { name: 'MITRE ATT&CK', path: '/mitre', icon: Network },
  { name: 'Incidents', path: '/incidents', icon: AlertTriangle },
  { name: 'Response / SOAR', path: '/response', icon: Cpu },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white/75 backdrop-blur-xl border-r border-white/80 shadow-[4px_0_24px_rgba(109,40,217,0.03)] flex flex-col justify-between p-5 min-h-screen sticky top-0">
      <div>
        {/* Brand Header with Official Logo */}
        <Link to="/" className="flex items-center space-x-3 px-2 py-3 mb-6 group">
          <img
            src="/assets/logo.png"
            alt="HoneyGuard Logo"
            className="w-10 h-10 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
          />
          <div>
            <div className="text-lg font-extrabold text-honey-indigo tracking-tight flex items-center">
              HoneyGuard
            </div>
            <div className="text-[9px] uppercase tracking-wider font-semibold text-purple-600/90 -mt-0.5">
              Cyber Intelligence
            </div>
          </div>
        </Link>

        {/* Home Link */}
        <div className="mb-4 px-2">
          <Link
            to="/"
            className="flex items-center space-x-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-purple-600 hover:bg-purple-50/60 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Product Overview</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                      : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status at Bottom */}
      <div className="pt-4 border-t border-slate-100">
        <StatusIndicator />
      </div>
    </aside>
  );
}
