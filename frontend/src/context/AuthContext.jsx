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
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('oee_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return DEMO_USERS[4]; // Default: Admin User
  });

  const [token, setToken] = useState(() => localStorage.getItem('oee_token') || '');

  // Perform backend login to fetch real JWT token
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
    localStorage.setItem('oee_user', JSON.stringify(user));
    authenticateWithBackend(user);
  }, [user]);

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
    <AuthContext.Provider value={{ user, token, switchDemoUser, hasRole, DEMO_USERS, ROLE_CONFIG }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
