import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

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

  useEffect(() => {
    let reconnectTimeout = null;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/stream`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setIsConnected(true);
          console.log("[HoneyGuard WS] Connected to real-time event bus");
        };

        socket.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            if (msg.type === "NEW_ATTACK") {
              const attack = msg.data;
              setLatestAttack(attack);
              setLiveAttackList(prev => [attack, ...prev.slice(0, 49)]);

              // Notification toast
              setAttackNotifications(prev => [
                { id: Date.now(), ...attack },
                ...prev.slice(0, 3)
              ]);

              // Remove after 6 seconds
              setTimeout(() => {
                setAttackNotifications(prev => prev.filter(n => Date.now() - n.id < 6000));
              }, 6000);
            } else if (msg.type === "ACTIVITY_STREAM") {
              setActivityStream(prev => [msg.data, ...prev.slice(0, 49)]);
            }
          } catch (err) {
            console.error("[HoneyGuard WS] Message parse error:", err);
          }
        };

        socket.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        socket.onerror = (err) => {
          socket.close();
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
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
