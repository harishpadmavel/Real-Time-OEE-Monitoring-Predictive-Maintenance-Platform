import React from 'react';
import { ROLE_CONFIG, DEMO_USERS } from '../context/AuthContext';

export default function RolesPage({ users = [] }) {
  const displayUsers = users.length > 0 ? users : DEMO_USERS;

  const initials = (name) =>
    name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <div>
      <div className="page-title">Users & Role-Based Access Controls</div>
      <p className="page-desc">
        Granular permission matrix defining access boundaries across Shop Floor, Maintenance, and Management.
      </p>

      {/* Permissions Matrix */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          ROLE PERMISSIONS MATRIX
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>System Role</th>
                <th>Visible Scope</th>
                <th>Authorized Actions</th>
                <th>API Access Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="pill">
                    <span className="dot" style={{ background: 'var(--green)' }}></span>
                    Operator
                  </span>
                </td>
                <td>Assigned machine station(s) only</td>
                <td>Log stoppage reasons, update station run/idle status, submit shift handover notes</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>Station Read & Downtime Write</td>
              </tr>
              <tr>
                <td>
                  <span className="pill">
                    <span className="dot" style={{ background: 'var(--amber)' }}></span>
                    Supervisor
                  </span>
                </td>
                <td>All 5 stations across Line-A</td>
                <td>Acknowledge line alerts, log downtime on any machine, monitor live shift OEE</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>Line Read/Write & Alert Ack</td>
              </tr>
              <tr>
                <td>
                  <span className="pill">
                    <span className="dot" style={{ background: '#8a7bff' }}></span>
                    Maintenance
                  </span>
                </td>
                <td>Equipment health history & diagnostics</td>
                <td>Acknowledge predictive alerts, close out repairs, track MTBF/MTTR diagnostics</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>Health Read/Write & Repair Logs</td>
              </tr>
              <tr>
                <td>
                  <span className="pill">
                    <span className="dot" style={{ background: '#4fc3d9' }}></span>
                    Manager
                  </span>
                </td>
                <td>Plant-wide lines, shifts, and reports</td>
                <td>Export 7-day OEE reports, compare station performance, configure shift schedules</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>Reporting Full & Read All</td>
              </tr>
              <tr>
                <td>
                  <span className="pill">
                    <span className="dot" style={{ background: 'var(--red)' }}></span>
                    Admin
                  </span>
                </td>
                <td>Full system control room</td>
                <td>Manage user accounts, add/edit machines, change alert thresholds, simulator overrides</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>Root Full Read/Write/Config</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Register */}
      <div className="panel">
        <h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>
          REGISTERED USERS & SYSTEM OPERATORS
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>Full Name</th>
                <th>Role</th>
                <th>System Email</th>
                <th>Assigned Production Line</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((u) => {
                const roleConf = ROLE_CONFIG[u.role] || { color: 'var(--amber)', label: u.role };
                return (
                  <tr key={u.email || u._id}>
                    <td style={{ width: '40px' }}>
                      <span className="user-avatar" style={{ width: '30px', height: '30px', fontSize: '11px', background: roleConf.color }}>
                        {initials(u.name)}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text)' }}>{u.name}</strong>
                    </td>
                    <td>
                      <span className="pill">
                        <span className="dot" style={{ background: roleConf.color }}></span>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{u.email}</td>
                    <td>{u.assignedLineId || u.line || 'All Lines'}</td>
                    <td>
                      <span style={{ fontSize: '11.5px', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                        ● Active
                      </span>
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
