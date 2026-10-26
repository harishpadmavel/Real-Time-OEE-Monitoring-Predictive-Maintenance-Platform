import React, { useState } from 'react';
import { ROLE_CONFIG } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

const ROLES = ['OPERATOR', 'SUPERVISOR', 'MAINTENANCE', 'MANAGER', 'ADMIN'];

const ROLE_COLORS = {
  OPERATOR: 'var(--green)',
  SUPERVISOR: 'var(--amber)',
  MAINTENANCE: 'var(--purple)',
  MANAGER: 'var(--cyan)',
  ADMIN: 'var(--red)',
};

function CreateUserModal({ onClose, onCreated, token }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERATOR',
    assignedLineId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Full name is required.');
    if (!form.email.trim().toLowerCase().endsWith('@gmail.com'))
      return setError('Only Gmail addresses (@gmail.com) are accepted.');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          role: form.role,
          assignedLineId: form.assignedLineId.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user.');
      onCreated(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleColor = ROLE_COLORS[form.role] || 'var(--amber)';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: '480px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(79,195,217,0.15)', border: '1px solid var(--cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Create New User
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Gmail addresses only &middot; Account active immediately
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
          >&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Full Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. John Smith"
              required
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                background: 'var(--panel-2)', border: '1px solid var(--steel)',
                color: 'var(--text)', fontSize: '13.5px', outline: 'none',
              }}
            />
          </div>

          {/* Gmail */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Gmail Address
            </label>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="user@gmail.com"
                required
                style={{
                  width: '100%', padding: '9px 12px 9px 32px', borderRadius: '8px',
                  background: 'var(--panel-2)', border: '1px solid var(--steel)',
                  color: 'var(--text)', fontSize: '13.5px', outline: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
            {form.email && !form.email.toLowerCase().endsWith('@gmail.com') && (
              <p style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '4px' }}>
                Must end with @gmail.com
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Temporary Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                required
                style={{
                  width: '100%', padding: '9px 38px 9px 12px', borderRadius: '8px',
                  background: 'var(--panel-2)', border: '1px solid var(--steel)',
                  color: 'var(--text)', fontSize: '13.5px', outline: 'none',
                  fontFamily: 'var(--font-mono)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                }}
              >
                {showPw ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Role + Line row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                style={{
                  width: '100%', padding: '9px 10px', borderRadius: '8px',
                  background: 'var(--panel-2)', border: `1px solid ${roleColor}`,
                  color: roleColor, fontSize: '13px', outline: 'none', cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r} style={{ color: 'var(--text)', background: 'var(--panel-2)' }}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Production Line
              </label>
              <input
                name="assignedLineId"
                value={form.assignedLineId}
                onChange={handleChange}
                placeholder="e.g. LINE-A"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  background: 'var(--panel-2)', border: '1px solid var(--steel)',
                  color: 'var(--text)', fontSize: '13px', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(230,72,60,0.12)', border: '1px solid rgba(230,72,60,0.3)',
              color: 'var(--red)', fontSize: '12.5px', display: 'flex', gap: '8px', alignItems: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px',
                background: 'var(--panel-2)', border: '1px solid var(--steel)',
                color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2, padding: '10px', borderRadius: '8px',
                background: loading ? 'var(--steel)' : 'linear-gradient(135deg, #4fc3d9, #2ba8c4)',
                border: 'none', color: '#fff', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading ? 'Creating...' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ user, onClose, onDeleted, token }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete user.');
      onDeleted(user._id);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '380px', width: '92%' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '12px',
            background: 'rgba(230,72,60,0.12)', border: '1px solid rgba(230,72,60,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </div>
          <h3 style={{ color: 'var(--text)', fontWeight: 700, fontSize: '15px', marginBottom: '6px' }}>
            Delete User Account
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Remove <strong style={{ color: 'var(--text)' }}>{user.name}</strong> ({user.email})? This cannot be undone.
          </p>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', borderRadius: '7px', background: 'rgba(230,72,60,0.12)', border: '1px solid rgba(230,72,60,0.3)', color: 'var(--red)', fontSize: '12px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--panel-2)', border: '1px solid var(--steel)', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--red)', border: 'none', color: '#fff', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RolesPage({ users = [] }) {
  const { user: currentUser, token, hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [localUsers, setLocalUsers] = useState(users);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Sync when parent-fetched users arrive
  React.useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  const initials = (name) =>
    name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  const handleCreated = (newUser) => {
    setLocalUsers((prev) => [newUser, ...prev]);
    setShowCreate(false);
    setSuccessMsg(`\u2713 ${newUser.name} (${newUser.email}) created successfully.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleDeleted = (userId) => {
    setLocalUsers((prev) => prev.filter((u) => u._id !== userId));
    setDeleteTarget(null);
    setSuccessMsg('\u2713 User account removed.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
        <div>
          <div className="page-title">Users &amp; Role-Based Access Controls</div>
          <p className="page-desc">
            Granular permission matrix defining access boundaries across Shop Floor, Maintenance, and Management.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #4fc3d9, #2ba8c4)',
              border: 'none', color: '#fff', fontSize: '13px',
              cursor: 'pointer', fontWeight: 700, letterSpacing: '0.04em',
              boxShadow: '0 0 16px rgba(79,195,217,0.3)',
              transition: 'box-shadow 0.2s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 24px rgba(79,195,217,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 16px rgba(79,195,217,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Create User
          </button>
        )}
      </div>

      {/* Success banner */}
      {successMsg && (
        <div style={{
          padding: '10px 16px', borderRadius: '8px', marginBottom: '16px',
          background: 'rgba(63,182,95,0.12)', border: '1px solid rgba(63,182,95,0.3)',
          color: 'var(--green)', fontSize: '13px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {successMsg}
        </div>
      )}

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
                <td><span className="pill"><span className="dot" style={{ background: 'var(--green)' }}></span>Operator</span></td>
                <td>Assigned machine station(s) only</td>
                <td>My Machine console (Start/Stop/Idle), live downtime timer &amp; resolution, manual production entry, shift sessions, maintenance &amp; supervisor dispatch, handover notes, activity audit feed</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>Assigned Machine Read/Write, Shifts, Production, Downtime</td>
              </tr>
              <tr>
                <td><span className="pill"><span className="dot" style={{ background: 'var(--amber)' }}></span>Supervisor</span></td>
                <td>All stations across Line-A</td>
                <td>Acknowledge line alerts, log downtime on any machine, monitor live shift OEE</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>Line Read/Write &amp; Alert Ack</td>
              </tr>
              <tr>
                <td><span className="pill"><span className="dot" style={{ background: '#8a7bff' }}></span>Maintenance</span></td>
                <td>Equipment health history &amp; diagnostics</td>
                <td>Acknowledge predictive alerts, close out repairs, track MTBF/MTTR diagnostics</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>Health Read/Write &amp; Repair Logs</td>
              </tr>
              <tr>
                <td><span className="pill"><span className="dot" style={{ background: '#4fc3d9' }}></span>Manager</span></td>
                <td>Plant-wide lines, shifts, and reports</td>
                <td>Export 7-day OEE reports, compare station performance, configure shift schedules</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>Reporting Full &amp; Read All</td>
              </tr>
              <tr>
                <td><span className="pill"><span className="dot" style={{ background: 'var(--red)' }}></span>Admin</span></td>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ marginBottom: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>
            REGISTERED USERS &amp; SYSTEM OPERATORS
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {localUsers.length} account{localUsers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {localUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4, marginBottom: '10px' }}>
              <circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/>
            </svg>
            <p style={{ fontSize: '13px' }}>No users registered yet.</p>
            {isAdmin && <p style={{ fontSize: '12px', marginTop: '4px' }}>Use the "Create User" button above to add accounts.</p>}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Gmail</th>
                  <th>Assigned Line</th>
                  <th>Status</th>
                  {isAdmin && <th style={{ textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {localUsers.map((u) => {
                  const roleConf = ROLE_CONFIG[u.role] || { color: 'var(--amber)', label: u.role };
                  const isSelf = u._id === currentUser?._id || u._id === currentUser?.id;
                  return (
                    <tr key={u.email || u._id}>
                      <td style={{ width: '40px' }}>
                        <span className="user-avatar" style={{ width: '30px', height: '30px', fontSize: '11px', background: roleConf.color }}>
                          {initials(u.name)}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text)' }}>{u.name}</strong>
                        {isSelf && (
                          <span style={{ fontSize: '10px', marginLeft: '6px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>you</span>
                        )}
                      </td>
                      <td>
                        <span className="pill">
                          <span className="dot" style={{ background: roleConf.color }}></span>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{u.email}</td>
                      <td>{u.assignedLineId || u.line || '\u2014'}</td>
                      <td>
                        <span style={{ fontSize: '11.5px', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>&bull; Active</span>
                      </td>
                      {isAdmin && (
                        <td style={{ textAlign: 'center' }}>
                          {!isSelf && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              title="Delete user"
                              style={{
                                background: 'rgba(230,72,60,0.1)', border: '1px solid rgba(230,72,60,0.25)',
                                borderRadius: '6px', padding: '4px 8px', cursor: 'pointer',
                                color: 'var(--red)', fontSize: '11px', fontWeight: 600,
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(230,72,60,0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(230,72,60,0.1)'}
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                              </svg>
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
          token={token}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
          token={token}
        />
      )}
    </div>
  );
}
