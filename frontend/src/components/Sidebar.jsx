import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentPage, onSelectPage, isOpen, onClose, downtimeBadge = 0, alertsBadge = 0 }) {
  const { user } = useAuth();
  const role = user?.role || 'OPERATOR';

  const navItems = [
    {
      group: role === 'OPERATOR' ? 'OPERATOR CONSOLE' : 'MONITORING',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          roles: ['OPERATOR', 'SUPERVISOR', 'MAINTENANCE', 'MANAGER', 'ADMIN'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
            </svg>
          ),
        },
        // Operator-specific Console Items
        {
          id: 'myMachine',
          label: 'My Machine',
          roles: ['OPERATOR'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" />
              <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />
            </svg>
          ),
        },
        {
          id: 'myShift',
          label: 'My Shift',
          roles: ['OPERATOR'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        },
        {
          id: 'requests',
          label: 'Requests',
          roles: ['OPERATOR'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          ),
        },
        {
          id: 'handover',
          label: 'Handover Notes',
          roles: ['OPERATOR'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
          ),
        },
        {
          id: 'myActivity',
          label: 'My Activity',
          roles: ['OPERATOR'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          ),
        },
        // General / Supervisor / Maintenance Monitoring Items
        {
          id: 'machines',
          label: 'Machines',
          roles: ['SUPERVISOR', 'MAINTENANCE', 'MANAGER', 'ADMIN'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          ),
        },
        {
          id: 'downtime',
          label: 'Downtime Log',
          roles: ['SUPERVISOR', 'MAINTENANCE', 'MANAGER', 'ADMIN'],
          badge: downtimeBadge > 0 ? downtimeBadge : null,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" />
            </svg>
          ),
        },
        {
          id: 'alerts',
          label: 'Predictive Alerts',
          roles: ['SUPERVISOR', 'MAINTENANCE', 'MANAGER', 'ADMIN'],
          badge: alertsBadge > 0 ? alertsBadge : null,
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 2 20h20L12 3z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'ANALYTICS',
      items: [
        {
          id: 'reports',
          label: 'OEE Reports',
          roles: ['SUPERVISOR', 'MANAGER', 'ADMIN'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" /><path d="M7 15l4-6 3 4 5-8" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'ADMIN',
      items: [
        {
          id: 'roles',
          label: 'Users & Roles',
          roles: ['MANAGER', 'ADMIN'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
        {
          id: 'settings',
          label: 'Settings',
          roles: ['ADMIN'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'ACCOUNT',
      items: [
        {
          id: 'profile',
          label: 'My Profile',
          roles: ['OPERATOR', 'SUPERVISOR', 'MAINTENANCE', 'MANAGER', 'ADMIN'],
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
        {navItems.map((group) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.group}>
              <div className="side-group-label">{group.group}</div>
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  className={`side-link ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => {
                    onSelectPage(item.id);
                    onClose();
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && <span className="side-badge">{item.badge}</span>}
                </button>
              ))}
            </div>
          );
        })}
      </nav>
    </>
  );
}
