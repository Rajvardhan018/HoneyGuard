import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ModeProvider } from './context/ModeContext';
import { WebSocketProvider } from './context/WebSocketContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Honeypots from './pages/Honeypots';
import LiveAttacks from './pages/LiveAttacks';
import AttackDetails from './pages/AttackDetails';
import ThreatIntelligence from './pages/ThreatIntelligence';
import Mitre from './pages/Mitre';
import Incidents from './pages/Incidents';
import Response from './pages/Response';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ModeProvider>
            <WebSocketProvider>
              <Routes>
                {/* Home Page (Cinematic Product Landing) */}
                <Route path="/" element={<Home />} />

                {/* Operational Cybersecurity Application Shell */}
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/honeypots" element={<Honeypots />} />
                  <Route path="/attacks" element={<LiveAttacks />} />
                  <Route path="/attacks/:id" element={<AttackDetails />} />
                  <Route path="/threat-intelligence" element={<ThreatIntelligence />} />
                  <Route path="/mitre" element={<Mitre />} />
                  <Route path="/incidents" element={<Incidents />} />
                  <Route path="/response" element={<Response />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </WebSocketProvider>
          </ModeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
