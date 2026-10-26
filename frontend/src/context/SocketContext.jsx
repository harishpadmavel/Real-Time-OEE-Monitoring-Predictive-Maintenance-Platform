import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-3), { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  useEffect(() => {
    // Connect to backend (environment variable, localhost:5001 for dev, or current origin)
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (window.location.hostname === 'localhost' ? 'http://localhost:5001' : window.location.origin);

    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 5000,
    });

    s.on('connect', () => {
      console.log('⚡ Socket.IO connected:', s.id);
      setIsConnected(true);
      addToast('Connected to Shop Floor Gateway', 'info');
    });

    s.on('connect_error', (err) => {
      // Graceful fallback for serverless hosting where WebSockets may not be active
      console.warn('Socket.IO connection notice (WebSockets may be unavailable on serverless host):', err.message);
    });

    s.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
    });

    s.on('downtimeStarted', (data) => {
      const name = data.machine?.name || 'Machine';
      addToast(`⚠ DOWNTIME STARTED: ${name} (${data.reason})`, 'alert');
    });

    s.on('downtimeResolved', (data) => {
      const name = data.machine?.name || 'Machine';
      addToast(`✔ DOWNTIME RESOLVED: ${name} back to RUNNING`, 'info');
    });

    s.on('maintenanceRequestCreated', (data) => {
      const name = data.machine?.name || 'Machine';
      const isHigh = data.priority === 'HIGH';
      addToast(
        `${isHigh ? '🚨' : '⚠️'} [${data.priority}] CALL FOR ${data.target}: ${name} — ${data.description}`,
        isHigh ? 'alert' : 'warn'
      );
    });

    s.on('maintenanceRequestUpdated', (data) => {
      const name = data.machine?.name || 'Machine';
      addToast(`✔ Request for ${name} is now ${data.status}`, 'info');
    });

    s.on('shiftStarted', (data) => {
      const name = data.machine?.name || 'Machine';
      addToast(`▶ Shift started on ${name} (${data.shiftName})`, 'info');
    });

    s.on('shiftEnded', (data) => {
      const name = data.machine?.name || 'Machine';
      const oee = Math.round(data.summary?.oee || 0);
      addToast(`🏁 Shift ended on ${name} (Shift OEE: ${oee}%)`, 'info');
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'alert' ? 'alert' : t.type === 'warn' ? 'warn' : ''}`}>
            <span>{t.type === 'alert' ? '🚨' : t.type === 'warn' ? '⚠️' : '⚡'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
