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
    // Connect to backend (proxied via Vite or port 5001 directly)
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5001' : window.location.origin;
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      console.log('⚡ Socket.IO connected:', s.id);
      setIsConnected(true);
      addToast('Connected to Shop Floor Gateway', 'info');
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
