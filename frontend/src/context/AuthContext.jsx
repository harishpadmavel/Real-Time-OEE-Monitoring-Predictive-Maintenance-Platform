import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();


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

  // Fetch current user profile with assigned machines from backend
  const refreshUser = async (authToken = token) => {
    const t = authToken || localStorage.getItem('oee_token');
    if (!t) return;
    try {
      const res = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const uData = await res.json();
        const mappedUser = {
          id: uData._id || uData.id,
          _id: uData._id || uData.id,
          name: uData.name,
          email: uData.email,
          role: uData.role,
          assignedLineId: uData.assignedLineId,
          assignedMachines: uData.assignedMachines || [],
        };
        setUser(mappedUser);
        localStorage.setItem('oee_user', JSON.stringify(mappedUser));
        return mappedUser;
      }
    } catch (err) {
      console.warn('Profile refresh fallback:', err.message);
    }
  };

  // Perform backend login to fetch a real JWT token & populated user
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
        if (data.user) {
          const userObj = {
            id: data.user.id || data.user._id,
            _id: data.user.id || data.user._id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            assignedLineId: data.user.assignedLineId,
            assignedMachines: data.user.assignedMachines || [],
          };
          setUser(userObj);
          localStorage.setItem('oee_user', JSON.stringify(userObj));
        }
      }
    } catch (err) {
      console.warn('Backend login fallback:', err.message);
    }
  };

  // Assign machines to current user
  const assignMachines = async (machineIds = [], all = false) => {
    const t = token || localStorage.getItem('oee_token');
    try {
      const res = await fetch('/api/users/assign-machine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({ machineIds, all }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const mapped = {
            id: data.user._id || data.user.id,
            _id: data.user._id || data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            assignedLineId: data.user.assignedLineId,
            assignedMachines: data.user.assignedMachines || [],
          };
          setUser(mapped);
          localStorage.setItem('oee_user', JSON.stringify(mapped));
          return mapped;
        }
      }
    } catch (err) {
      console.error('Failed to assign machines:', err);
    }
  };

  // Auto-refresh profile on mount or token change
  useEffect(() => {
    const t = localStorage.getItem('oee_token');
    if (t) {
      refreshUser(t);
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('oee_user', JSON.stringify(user));
    }
  }, [user]);

  // Login with email + password — authenticates against the real backend only
  const loginWithCredentials = async (email, password) => {
    setLoginError('');
    const trimEmail = email.trim().toLowerCase();

    // Authenticate against real backend
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
        if (res.status === 502 || res.status === 503 || res.status === 504) {
          throw new Error('Backend server is offline. Please make sure the backend API (port 5001) and MongoDB are running.');
        }
        if (res.status === 401) {
          throw new Error(data.message || 'Invalid email or password.');
        }
        throw new Error(data.message || `Server error (${res.status}). Please check backend service.`);
      }
    } catch (err) {
      let msg = err.message || 'Login failed. Please try again.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
        msg = 'Cannot connect to server. Please verify the backend is running on port 5001 and MongoDB is active.';
      }
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
        if (res.status === 502 || res.status === 503 || res.status === 504) {
          throw new Error('Backend server is offline. Please make sure the backend API (port 5001) is running.');
        }
        throw new Error(data.message || 'Registration failed.');
      }
      if (data.token && data.user) {
        setToken(data.token);
        localStorage.setItem('oee_token', data.token);
        const userObj = {
          id: data.user.id || data.user._id,
          _id: data.user.id || data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          assignedLineId: data.user.assignedLineId,
          assignedMachines: data.user.assignedMachines || [],
        };
        setUser(userObj);
        localStorage.setItem('oee_user', JSON.stringify(userObj));
      }
      return data;
    } catch (err) {
      let msg = err.message || 'Registration failed. Please try again.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
        msg = 'Cannot connect to server. Please verify the backend is running on port 5001.';
      }
      setLoginError(msg);
      throw new Error(msg);
    }
  };

  // Update user profile (name, email, assignedLineId, passwords)
  const updateUserProfile = async ({ name, email, assignedLineId, currentPassword, newPassword }) => {
    const t = token || localStorage.getItem('oee_token');
    if (!t) throw new Error('Not authenticated.');

    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify({ name, email, assignedLineId, currentPassword, newPassword }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Failed to update profile.');
    }

    if (data.token) {
      setToken(data.token);
      localStorage.setItem('oee_token', data.token);
    }
    if (data.user) {
      const userObj = {
        id: data.user.id || data.user._id,
        _id: data.user.id || data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        assignedLineId: data.user.assignedLineId,
        assignedMachines: data.user.assignedMachines || [],
      };
      setUser(userObj);
      localStorage.setItem('oee_user', JSON.stringify(userObj));
    }
    return data;
  };

  // Logout — clears all auth state and storage
  const logout = () => {
    setUser(null);
    setToken('');
    setLoginError('');
    localStorage.removeItem('oee_user');
    localStorage.removeItem('oee_token');
  };

  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated,
      loginWithCredentials, registerUser, updateUserProfile, logout, loginError,
      hasRole, refreshUser, assignMachines, ROLE_CONFIG,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
