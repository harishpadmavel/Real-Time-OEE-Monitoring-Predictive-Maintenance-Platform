import React, { useState, useEffect } from 'react';
import { useAuth, ROLE_CONFIG } from '../context/AuthContext';

export default function ProfilePage({ machines = [] }) {
  const { user, updateUserProfile, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit'

  const roleConf = ROLE_CONFIG[user?.role] || {
    color: 'var(--amber)',
    label: user?.role || 'User',
    access: 'Standard Access',
  };

  const initials = (name) =>
    name
      ? name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'U';

  // Form state
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    assignedLineId: user?.assignedLineId || 'LINE-A',
  });

  // Password change state
  const [enablePasswordChange, setEnablePasswordChange] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status feedback
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync form when user changes
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        assignedLineId: user.assignedLineId || 'LINE-A',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
    setSuccessMsg('');
  };

  const resetForm = () => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      assignedLineId: user?.assignedLineId || 'LINE-A',
    });
    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setEnablePasswordChange(false);
    setErrorMsg('');
    setSuccessMsg('');
    setActiveTab('overview');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Client-side validations
    if (!form.name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!form.email.trim()) {
      setErrorMsg('Email address is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (enablePasswordChange) {
      if (!passwords.currentPassword) {
        setErrorMsg('Please enter your current password to change it.');
        return;
      }
      if (!passwords.newPassword || passwords.newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        return;
      }
      if (passwords.newPassword !== passwords.confirmPassword) {
        setErrorMsg('New passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        assignedLineId: form.assignedLineId,
      };

      if (enablePasswordChange && passwords.newPassword) {
        payload.currentPassword = passwords.currentPassword;
        payload.newPassword = passwords.newPassword;
      }

      await updateUserProfile(payload);
      setSuccessMsg('Profile updated successfully! Changes are active immediately.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setEnablePasswordChange(false);
      if (refreshUser) refreshUser();

      // Auto switch back to overview after brief delay
      setTimeout(() => {
        setActiveTab('overview');
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine user's machines
  const assignedMachinesList =
    user?.assignedMachines && user.assignedMachines.length > 0
      ? user.assignedMachines
      : machines.filter((m) => m.lineId === (user?.assignedLineId || 'LINE-A'));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Title Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <div className="page-title">My Account & Access Profile</div>
          <p className="page-desc">
            Manage your personal profile, operational line assignment, and account security.
          </p>
        </div>
      </div>

      {/* Hero Card */}
      <div className="panel" style={{ marginBottom: '20px' }}>
        <div className="profile-hero" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <span
              className="user-avatar profile-avatar"
              style={{
                background: roleConf.color,
                boxShadow: `0 0 20px -2px ${roleConf.color}66`,
              }}
            >
              {initials(user?.name)}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="profile-name">{user?.name}</span>
                <span
                  className="pill"
                  style={{
                    borderColor: roleConf.color,
                    color: roleConf.color,
                    fontSize: '11px',
                    padding: '2px 8px',
                  }}
                >
                  <span className="dot" style={{ background: roleConf.color }}></span>
                  {user?.role}
                </span>
              </div>
              <div className="profile-email">{user?.email}</div>
            </div>
          </div>

          {/* Action Button: Edit Profile Toggle */}
          <div className="profile-edit-header-action">
            <button
              id="btn-toggle-edit-profile"
              type="button"
              className={`profile-edit-btn ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(activeTab === 'edit' ? 'overview' : 'edit');
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              {activeTab === 'edit' ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 14 4 9 9 4" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                  </svg>
                  Back to Overview
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="profile-tab-bar">
          <button
            id="tab-profile-overview"
            className={`profile-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            Profile Overview
          </button>
          <button
            id="tab-profile-edit"
            className={`profile-tab-item ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
            type="button"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Edit Profile & Security
          </button>
        </div>

        {/* Global Feedback Messages */}
        {successMsg && (
          <div className="login-alert login-alert--success" style={{ marginBottom: '16px' }} role="status">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="login-alert login-alert--error" style={{ marginBottom: '16px' }} role="alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="profile-meta-grid" style={{ marginBottom: '24px' }}>
              <div className="profile-meta">
                <div className="pm-label">Assigned Production Line</div>
                <div className="pm-value" style={{ color: 'var(--cyan)' }}>
                  {user?.assignedLineId || 'LINE-A (All Stations)'}
                </div>
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
                <div className="pm-value" style={{ color: 'var(--green)' }}>
                  ● Authenticated (JWT)
                </div>
              </div>
            </div>

            {/* Equipment Access Scope */}
            <div className="profile-section-card">
              <div className="profile-section-header">
                <div className="profile-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                  Operational Station Access
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {assignedMachinesList.length} Station{assignedMachinesList.length !== 1 ? 's' : ''} Accessible
                </span>
              </div>

              {assignedMachinesList.length > 0 ? (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {assignedMachinesList.map((m) => (
                    <div key={m._id || m.id || m.name} className="profile-machine-chip">
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: m.status === 'RUNNING' ? 'var(--green)' : m.status === 'DOWN' ? 'var(--red)' : 'var(--amber)',
                        }}
                      />
                      <span style={{ fontWeight: 600 }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({m.lineId || 'Line A'})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Assigned to all stations on {user?.assignedLineId || 'LINE-A'}.
                </p>
              )}
            </div>

            {/* Role Privilege Matrix */}
            <div className="profile-section-card" style={{ marginBottom: 0 }}>
              <div className="profile-section-header">
                <div className="profile-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Authorized Capabilities & Roles
                </div>
                <span className="pill" style={{ borderColor: roleConf.color, color: roleConf.color }}>
                  {user?.role} Tier
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--green)' }}>✓</span> Live Telemetry & Dashboard
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--green)' }}>✓</span> Production & Downtime Logging
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--green)' }}>✓</span> Maintenance Ticket Requests
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: user?.role === 'OPERATOR' ? 'var(--text-muted)' : 'var(--green)' }}>
                    {user?.role === 'OPERATOR' ? '✕' : '✓'}
                  </span>
                  Machine Control & Overrides
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: ['ADMIN', 'MANAGER'].includes(user?.role) ? 'var(--green)' : 'var(--text-muted)' }}>
                    {['ADMIN', 'MANAGER'].includes(user?.role) ? '✓' : '✕'}
                  </span>
                  Full Audit & Shift Reports
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: user?.role === 'ADMIN' ? 'var(--green)' : 'var(--text-muted)' }}>
                    {user?.role === 'ADMIN' ? '✓' : '✕'}
                  </span>
                  User Management & Roles
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EDIT PROFILE */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSubmit} noValidate>
            {/* Section A: Personal Details */}
            <div className="profile-section-card">
              <div className="profile-section-header">
                <div className="profile-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  Personal & Line Information
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  All fields saved to your user record
                </span>
              </div>

              <div className="profile-form-grid">
                {/* Full Name */}
                <div className="login-field">
                  <label htmlFor="edit-name">Full Name *</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="edit-name"
                      name="name"
                      type="text"
                      placeholder="e.g. Harish Padmavel"
                      value={form.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="login-field">
                  <label htmlFor="edit-email">Email Address *</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      id="edit-email"
                      name="email"
                      type="email"
                      placeholder="e.g. harish@gmail.com"
                      value={form.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Assigned Production Line */}
                <div className="login-field">
                  <label htmlFor="edit-line">Assigned Production Line</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                      </svg>
                    </span>
                    <select
                      id="edit-line"
                      name="assignedLineId"
                      value={form.assignedLineId}
                      onChange={handleInputChange}
                    >
                      <option value="LINE-A">LINE-A (Forging & Machining)</option>
                      <option value="LINE-B">LINE-B (Assembly & Heat Treatment)</option>
                      <option value="LINE-C">LINE-C (Finishing & Quality Gate)</option>
                      <option value="ALL">ALL LINES (Plant-wide Scope)</option>
                    </select>
                  </div>
                </div>

                {/* System Role (Read-only badge) */}
                <div className="login-field">
                  <label>System Role & Permissions</label>
                  <div
                    style={{
                      height: '42px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0 14px',
                      background: 'var(--panel-2)',
                      border: '1px solid var(--steel)',
                      borderRadius: '10px',
                    }}
                  >
                    <span
                      className="pill"
                      style={{
                        borderColor: roleConf.color,
                        color: roleConf.color,
                        fontSize: '12px',
                        padding: '2px 8px',
                      }}
                    >
                      <span className="dot" style={{ background: roleConf.color }}></span>
                      {user?.role}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      (Role elevation managed by Admins)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: Security / Password Change */}
            <div className="profile-section-card">
              <div className="profile-section-header">
                <div className="profile-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Account Security & Password
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text)' }}>
                  <input
                    id="checkbox-change-password"
                    type="checkbox"
                    checked={enablePasswordChange}
                    onChange={(e) => {
                      setEnablePasswordChange(e.target.checked);
                      if (!e.target.checked) {
                        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      }
                    }}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--cyan)' }}
                  />
                  <span>Change Password</span>
                </label>
              </div>

              {enablePasswordChange ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Current Password */}
                  <div className="login-field">
                    <label htmlFor="edit-curr-password">Current Password *</label>
                    <div className="login-input-wrap">
                      <span className="login-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        id="edit-curr-password"
                        name="currentPassword"
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="Enter your current password"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        autoComplete="current-password"
                        required={enablePasswordChange}
                      />
                      <button
                        type="button"
                        className="login-eye-btn"
                        onClick={() => setShowCurrent((v) => !v)}
                        aria-label={showCurrent ? 'Hide password' : 'Show password'}
                      >
                        {showCurrent ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="profile-form-grid" style={{ marginBottom: 0 }}>
                    {/* New Password */}
                    <div className="login-field">
                      <label htmlFor="edit-new-password">New Password * (min. 6 characters)</label>
                      <div className="login-input-wrap">
                        <span className="login-input-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                        <input
                          id="edit-new-password"
                          name="newPassword"
                          type={showNew ? 'text' : 'password'}
                          placeholder="Create strong password"
                          value={passwords.newPassword}
                          onChange={handlePasswordChange}
                          autoComplete="new-password"
                          required={enablePasswordChange}
                        />
                        <button
                          type="button"
                          className="login-eye-btn"
                          onClick={() => setShowNew((v) => !v)}
                          aria-label={showNew ? 'Hide password' : 'Show password'}
                        >
                          {showNew ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="login-field">
                      <label htmlFor="edit-confirm-password">Confirm New Password *</label>
                      <div className="login-input-wrap">
                        <span className="login-input-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12l2 2 4-4" /><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </span>
                        <input
                          id="edit-confirm-password"
                          name="confirmPassword"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Repeat new password"
                          value={passwords.confirmPassword}
                          onChange={handlePasswordChange}
                          autoComplete="new-password"
                          required={enablePasswordChange}
                        />
                        <button
                          type="button"
                          className="login-eye-btn"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                          {showConfirm ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Password is securely hashed with bcrypt. Check the box above if you want to set a new password.
                </p>
              )}
            </div>

            {/* Actions Bar */}
            <div className="profile-actions-bar">
              <button
                id="btn-cancel-profile-edit"
                type="button"
                className="profile-cancel-btn"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                id="btn-save-profile"
                type="submit"
                className="profile-save-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="login-spinner" style={{ width: '14px', height: '14px' }} />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
