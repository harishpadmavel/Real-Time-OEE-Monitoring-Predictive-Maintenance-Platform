import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const DEMO_USERS = [
  { name: 'Shop Operator', email: 'operator@oee.local', role: 'OPERATOR', line: 'LINE-A', password: 'oper123' },
  { name: 'Line Supervisor', email: 'supervisor@oee.local', role: 'SUPERVISOR', line: 'LINE-A', password: 'super123' },
  { name: 'Maintenance Tech', email: 'maintenance@oee.local', role: 'MAINTENANCE', line: 'All Lines', password: 'maint123' },
  { name: 'Plant Manager', email: 'manager@oee.local', role: 'MANAGER', line: 'All Lines', password: 'manager123' },
  { name: 'Admin User', email: 'admin@oee.local', role: 'ADMIN', line: 'All Lines', password: 'admin123' },
];

export const ROLE_CONFIG = {
  OPERATOR: { color: 'var(--green)', label: 'Operator', access: 'Assigned machine(s) only' },
  SUPERVISOR: { color: 'var(--amber)', label: 'Supervisor', access: 'All machines on Line-A' },
  MAINTENANCE: { color: '#8a7bff', label: 'Maintenance', access: 'Machine health & alerts' },
  MANAGER: { color: '#4fc3d9', label: 'Manager', access: 'All lines, all shifts, reports' },
  ADMIN: { color: 'var(--red)', label: 'Admin', access: 'Full system access' },
};

export function AuthProvider({ children }) {
  // Start unauthenticated — the login page will be shown
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('oee_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('oee_token') || '');
  const [loginError, setLoginError] = useState('');

  const isAuthenticated = !!user;

  // Perform backend login to fetch a real JWT token
  const authenticateWithBackend = async (demoUser) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoUser.email, password: demoUser.password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem('oee_token', data.token);
      }
    } catch (err) {
      console.warn('Backend login fallback:', err.message);
    }
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('oee_user', JSON.stringify(user));
    }
  }, [user]);

  // Login with email + password — checks demo users first, then real backend
  const loginWithCredentials = async (email, password) => {
    setLoginError('');
    const trimEmail = email.trim().toLowerCase();

    // Match against demo users first
    const demoMatch = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === trimEmail && u.password === password
    );
    if (demoMatch) {
      setUser(demoMatch);
      await authenticateWithBackend(demoMatch);
      return;
    }

    // Fall through to real backend
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimEmail, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('oee_token', data.token);
        const userObj = data.user || { email: trimEmail, name: trimEmail, role: 'OPERATOR' };
        setUser(userObj);
        localStorage.setItem('oee_user', JSON.stringify(userObj));
      } else {
        throw new Error(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      const msg = err.message || 'Login failed. Please try again.';
      setLoginError(msg);
      throw new Error(msg);
    }
  };

  // Register a new account via backend
  const registerUser = async ({ name, email, password, role }) => {
    setLoginError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }
      return data;
    } catch (err) {
      const msg = err.message || 'Registration failed. Please try again.';
      setLoginError(msg);
      throw new Error(msg);
    }
  };

  // Logout — clears all auth state and storage
  const logout = () => {
    setUser(null);
    setToken('');
    setLoginError('');
    localStorage.removeItem('oee_user');
    localStorage.removeItem('oee_token');
  };

  const switchDemoUser = (role) => {
    const target = DEMO_USERS.find((u) => u.role === role);
    if (target) {
      setUser(target);
      authenticateWithBackend(target);
    }
  };

  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated,
      loginWithCredentials, registerUser, logout, loginError,
      switchDemoUser, hasRole, DEMO_USERS, ROLE_CONFIG,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
