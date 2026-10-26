import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithCredentials, registerUser, loginError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'OPERATOR',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setLocalError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');

    if (mode === 'register') {
      if (!form.name.trim()) { setLocalError('Name is required.'); return; }
      if (form.password !== form.confirmPassword) { setLocalError('Passwords do not match.'); return; }
      if (form.password.length < 6) { setLocalError('Password must be at least 6 characters.'); return; }
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await loginWithCredentials(form.email, form.password);
      } else {
        await registerUser({ name: form.name, email: form.email, password: form.password, role: form.role });
        setSuccessMsg('Account created! You can now log in.');
        setMode('login');
        setForm((p) => ({ ...p, password: '', confirmPassword: '', name: '' }));
      }
    } catch (err) {
      setLocalError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setLocalError('');
    setSuccessMsg('');
    setForm({ name: '', email: '', password: '', confirmPassword: '', role: 'OPERATOR' });
  };

  const errorText = localError || loginError;

  return (
    <div className="login-page">
      <div className="login-bg-blob blob-1" />
      <div className="login-bg-blob blob-2" />
      <div className="login-bg-blob blob-3" />

      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="var(--cyan)" strokeWidth="2.5" fill="none" />
              <path d="M16 6 L16 16 L24 20" stroke="var(--cyan)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="16" cy="16" r="3" fill="var(--cyan)" />
            </svg>
          </div>
          <div>
            <h1 className="login-title">OEE Monitor</h1>
            <p className="login-subtitle">Real-Time Production Intelligence</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            id="tab-login"
            className={'login-tab' + (mode === 'login' ? ' active' : '')}
            onClick={() => mode !== 'login' && toggleMode()}
            type="button"
          >
            Sign In
          </button>
          <button
            id="tab-register"
            className={'login-tab' + (mode === 'register' ? ' active' : '')}
            onClick={() => mode !== 'register' && toggleMode()}
            type="button"
          >
            Create Account
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className="login-field">
              <label htmlFor="login-name">Full Name</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input id="login-name" name="name" type="text" placeholder="Jane Smith" value={form.name} onChange={handleChange} autoComplete="name" required />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="login-field">
              <label htmlFor="login-role">Role</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                </span>
                <select id="login-role" name="role" value={form.role} onChange={handleChange}>
                  <option value="OPERATOR">Operator</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="MAINTENANCE">Maintenance Tech</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-email">Email Address</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input id="login-email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" required />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode === 'login' ? 'Enter your password' : 'Min. 6 characters'}
                value={form.password}
                onChange={handleChange}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
              <button
                id="toggle-password-visibility"
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
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

          {mode === 'register' && (
            <div className="login-field">
              <label htmlFor="login-confirm-password">Confirm Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4" /><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="login-confirm-password"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  id="toggle-confirm-visibility"
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
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
          )}

          {errorText && (
            <div className="login-alert login-alert--error" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errorText}
            </div>
          )}

          {successMsg && (
            <div className="login-alert login-alert--success" role="status">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {successMsg}
            </div>
          )}

          <button id="login-submit-btn" type="submit" className="login-btn-primary" disabled={isLoading}>
            {isLoading ? (
              <span className="login-spinner" />
            ) : mode === 'login' ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign In
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Create Account
              </>
            )}
          </button>
        </form>

        {mode === 'login' && (
          <details className="login-demo-hint">
            <summary>Demo credentials (click to auto-fill)</summary>
            <div className="login-demo-grid">
              <div
                className="login-demo-row"
                title="Click to fill Operator credentials"
                onClick={() => {
                  setForm((p) => ({ ...p, email: 'operator@oee.local', password: 'oper123' }));
                  setLocalError('');
                }}
              >
                <span className="login-demo-role operator">Operator</span>
                <code>operator@oee.local</code>
                <code>oper123</code>
              </div>
              <div
                className="login-demo-row"
                title="Click to fill Supervisor credentials"
                onClick={() => {
                  setForm((p) => ({ ...p, email: 'supervisor@oee.local', password: 'super123' }));
                  setLocalError('');
                }}
              >
                <span className="login-demo-role supervisor">Supervisor</span>
                <code>supervisor@oee.local</code>
                <code>super123</code>
              </div>
              <div
                className="login-demo-row"
                title="Click to fill Admin credentials"
                onClick={() => {
                  setForm((p) => ({ ...p, email: 'admin@oee.local', password: 'admin123' }));
                  setLocalError('');
                }}
              >
                <span className="login-demo-role admin">Admin</span>
                <code>admin@oee.local</code>
                <code>admin123</code>
              </div>
            </div>
          </details>
        )}

        <p className="login-footer">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button id="login-switch-mode" type="button" className="login-link-btn" onClick={toggleMode}>
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
