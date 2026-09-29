import React, { useState, useEffect } from 'react';
import { useAuth, ROLE_CONFIG } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';

export default function Header({ onToggleSidebar, onSelectPage }) {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().slice(0, 8));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const roleColor = ROLE_CONFIG[user?.role]?.color || 'var(--amber)';
  const isDark = theme === 'dark';

  return (
    <>
      <div className="hazard-strip"></div>
      <header className="topbar">
        <div className="brand">
          <button className="hamburger" onClick={onToggleSidebar} aria-label="Toggle menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <svg className="brand-gear" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M32 8 L36 16 L45 13 L45 22 L54 26 L47 32 L54 38 L45 42 L45 51 L36 48 L32 56 L28 48 L19 51 L19 42 L10 38 L17 32 L10 26 L19 22 L19 13 L28 16 Z" />
            <circle cx="32" cy="32" r="8" />
          </svg>
          <div>
            <div className="brand-name">FORGEPOINT</div>
            <div className="brand-sub">Auto Components — Line A Control Room</div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="conn-status" title={isConnected ? 'Live WebSocket Connected' : 'Connecting to backend...'}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? 'var(--green)' : 'var(--amber)',
                boxShadow: isConnected ? '0 0 6px 1px var(--green-glow)' : '0 0 6px 1px var(--amber-glow)',
                display: 'inline-block',
              }}
            ></span>
            <span>{isConnected ? 'LIVE IOT' : 'SYNCING'}</span>
          </div>

          <div className="shift-tag">SHIFT A · 06:00–14:00</div>
          <div className="clock">{timeStr || '--:--:--'}</div>

          {/* ── Theme Toggle ── */}
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--steel)',
              background: 'var(--panel-2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <span style={{
              position: 'absolute',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s',
              transform: isDark ? 'translateY(0) rotate(0deg)' : 'translateY(-36px) rotate(90deg)',
              opacity: isDark ? 1 : 0,
            }}>🌙</span>
            <span style={{
              position: 'absolute',
              transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s',
              transform: isDark ? 'translateY(36px) rotate(-90deg)' : 'translateY(0) rotate(0deg)',
              opacity: isDark ? 0 : 1,
            }}>☀️</span>
          </button>

          <button className="user-chip" onClick={() => onSelectPage('profile')}>
            <span className="user-avatar" style={{ background: roleColor }}>
              {initials}
            </span>
            <span className="user-chip-text">
              <span className="user-chip-name">{user?.name}</span>
              <span className="user-chip-role">{user?.role}</span>
            </span>
          </button>
        </div>
      </header>
    </>
  );
}
