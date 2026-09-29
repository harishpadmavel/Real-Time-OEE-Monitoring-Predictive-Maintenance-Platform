import React from 'react';
import { useAuth, ROLE_CONFIG, DEMO_USERS } from '../context/AuthContext';

export default function ProfilePage({ allUsers = [] }) {
  const { user, switchDemoUser } = useAuth();
  const roleConf = ROLE_CONFIG[user?.role] || { color: 'var(--amber)', label: user?.role, access: 'Standard' };

  const initials = (name) =>
    name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  const displayUsers = allUsers.length > 0 ? allUsers : DEMO_USERS;

  return (
    <div>
      <div className="page-title">My Account & Access Profile</div>
      <p className="page-desc">
        Active identity profile, authorized operational scope, and role switching for presentation demonstrations.
      </p>

      {/* User Hero */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="profile-hero">
          <span className="user-avatar profile-avatar" style={{ background: roleConf.color }}>
            {initials(user?.name)}
          </span>
          <div>
            <div className="profile-name">{user?.name}</div>
            <div className="profile-email">{user?.email}</div>
            <span className="pill" style={{ marginTop: '8px', borderColor: roleConf.color, color: roleConf.color }}>
              <span className="dot" style={{ background: roleConf.color }}></span>
              {user?.role}
            </span>
          </div>
        </div>

        <div className="profile-meta-grid">
          <div className="profile-meta">
            <div className="pm-label">Assigned Production Line</div>
            <div className="pm-value">{user?.line || 'LINE-A (All Stations)'}</div>
          </div>
          <div className="profile-meta">
            <div className="pm-label">Current Work Shift</div>
            <div className="pm-value">Shift A · 06:00–14:00</div>
          </div>
          <div className="profile-meta">
            <div className="pm-label">Permission Level</div>
            <div className="pm-value">{roleConf.access}</div>
          </div>
          <div className="profile-meta">
            <div className="pm-label">Session Status</div>
            <div className="pm-value" style={{ color: 'var(--green)' }}>● Authenticated (JWT)</div>
          </div>
        </div>
      </div>

      {/* Quick Switch Demo Logins */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '8px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          SWITCH DEMO LOGIN (ROLE-BASED ACCESS CONTROL DEMONSTRATION)
        </h2>
        <p className="page-desc" style={{ marginBottom: '14px' }}>
          Click any role below to instantly switch sessions. Notice how the sidebar navigation links, permitted actions, and visibility adjust dynamically based on role.
        </p>

        <div className="switch-user-row">
          {DEMO_USERS.map((u) => {
            const conf = ROLE_CONFIG[u.role] || {};
            const isActive = user?.role === u.role;

            return (
              <button
                key={u.role}
                className={`switch-user-btn ${isActive ? 'active' : ''}`}
                onClick={() => switchDemoUser(u.role)}
              >
                <span className="user-avatar" style={{ width: '26px', height: '26px', fontSize: '11px', background: conf.color }}>
                  {initials(u.name)}
                </span>
                <span>{u.name}</span>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                  ({u.role})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* All Available User Logins */}
      <div className="panel">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          SYSTEM USERS & CREDENTIALS DIRECTORY
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Role</th>
                <th>Email Login</th>
                <th>Line Scope</th>
                <th>Default Password</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((u) => {
                const conf = ROLE_CONFIG[u.role] || {};
                return (
                  <tr key={u.email}>
                    <td style={{ width: '36px' }}>
                      <span className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '11px', background: conf.color }}>
                        {initials(u.name)}
                      </span>
                    </td>
                    <td><strong>{u.name}</strong></td>
                    <td>
                      <span className="pill">
                        <span className="dot" style={{ background: conf.color }}></span>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{u.email}</td>
                    <td>{u.assignedLineId || u.line || 'All Lines'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--amber)' }}>
                      {u.password || '(configured in seed)'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
