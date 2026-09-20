import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { api } from '../services/api';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestAttack, setLatestAttack] = useState(null);
  const [attackNotifications, setAttackNotifications] = useState([]);
  const [activityStream, setActivityStream] = useState([
    { time: "10:24:21", text: "[10:24:21] SSH connection established from 185.199.110.23:51234", severity: "HIGH" },
    { time: "10:24:18", text: "[10:24:18] Authentication failure (user: root, attempts: 14)", severity: "CRITICAL" },
    { time: "10:24:17", text: "[10:24:17] Threat Score: 87.0 (CRITICAL) - Escalating deception tier", severity: "CRITICAL" },
    { time: "10:24:16", text: "[10:24:16] Incident INC-2026-001 created autonomously", severity: "CRITICAL" },
    { time: "10:24:15", text: "[10:24:15] SOAR Playbook PLAYBOOK-CRIT-01 executed (Simulated Quarantine)", severity: "HIGH" }
  ]);
  const [liveAttackList, setLiveAttackList] = useState([]);
  const wsRef = useRef(null);
  const knownAttackIdsRef = useRef(new Set());
  const isPollingRef = useRef(false);

  useEffect(() => {
    let reconnectTimeout = null;
    let pollingInterval = null;
    let retryCount = 0;
    let isUnmounted = false;

    // Trigger toast notification for incoming attack
    const handleNewAttack = (attack) => {
      setLatestAttack(attack);
      setLiveAttackList(prev => {
        if (prev.some(a => a.id === attack.id)) return prev;
        return [attack, ...prev.slice(0, 49)];
      });

      setAttackNotifications(prev => [
        { id: Date.now(), ...attack },
        ...prev.slice(0, 3)
      ]);

      setTimeout(() => {
        if (!isUnmounted) {
          setAttackNotifications(prev => prev.filter(n => Date.now() - n.id < 6000));
        }
      }, 6000);
    };

    // Polling fallback when WebSocket is unavailable (e.g. Vercel Serverless)
    const startPollingFallback = () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      setIsConnected(true);
      console.log("[HoneyGuard Stream] Operating in HTTP telemetry polling mode (Vercel Serverless compatible)");

      const poll = async () => {
        if (isUnmounted) return;
        try {
          const attacks = await api.getAttacks({ limit: 10 });
          if (Array.isArray(attacks) && attacks.length > 0) {
            // Check for new attacks
            const newlySeen = [];
            for (const atk of attacks) {
              if (atk.id && !knownAttackIdsRef.current.has(atk.id)) {
                knownAttackIdsRef.current.add(atk.id);
                newlySeen.push(atk);
              }
            }

            if (newlySeen.length > 0) {
              // Fire notification for newest attack
              const topAttack = newlySeen[0];
              handleNewAttack(topAttack);

              // Add activity stream entry
              const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });
              setActivityStream(prev => [
                {
                  time: nowTime,
                  text: `[${nowTime}] ${topAttack.protocol?.toUpperCase() || 'NET'} threat detected from ${topAttack.source_ip || 'unknown'} (Score: ${topAttack.threat_score || 0})`,
                  severity: topAttack.severity || 'HIGH'
                },
                ...prev.slice(0, 49)
              ]);
            }
          }
        } catch (err) {
          // Gracefully handle transient network errors
          console.debug("[HoneyGuard Polling] Polling tick:", err.message);
        }
      };

      // Initial poll immediately, then every 4 seconds
      poll();
      pollingInterval = setInterval(poll, 4000);
    };

    function connect() {
      if (isUnmounted) return;

      // Determine WebSocket URL
      const customWsUrl = import.meta.env.VITE_WS_URL;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = customWsUrl || `${protocol}//${host}/ws/stream`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          retryCount = 0;
          if (pollingInterval) {
            clearInterval(pollingInterval);
            isPollingRef.current = false;
          }
          console.log("[HoneyGuard WS] Connected to real-time event bus:", wsUrl);
        };

        socket.onmessage = (evt) => {
          if (isUnmounted) return;
          try {
            const msg = JSON.parse(evt.data);
            if (msg.type === "NEW_ATTACK") {
              const attack = msg.data;
              if (attack && attack.id) {
                knownAttackIdsRef.current.add(attack.id);
              }
              handleNewAttack(attack);
            } else if (msg.type === "ACTIVITY_STREAM") {
              setActivityStream(prev => [msg.data, ...prev.slice(0, 49)]);
            }
          } catch (err) {
            console.error("[HoneyGuard WS] Message parse error:", err);
          }
        };

        socket.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          retryCount += 1;
          if (retryCount >= 2) {
            // Activate polling fallback to ensure stream continues seamlessly
            startPollingFallback();
            // Check WS again with longer backoff
            reconnectTimeout = setTimeout(connect, 15000);
          } else {
            reconnectTimeout = setTimeout(connect, 3000);
          }
        };

        socket.onerror = () => {
          socket.close();
        };
      } catch (e) {
        retryCount += 1;
        if (retryCount >= 2) {
          startPollingFallback();
          reconnectTimeout = setTimeout(connect, 15000);
        } else {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollingInterval) clearInterval(pollingInterval);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const dismissNotification = (id) => {
    setAttackNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      latestAttack,
      attackNotifications,
      dismissNotification,
      activityStream,
      liveAttackList
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
