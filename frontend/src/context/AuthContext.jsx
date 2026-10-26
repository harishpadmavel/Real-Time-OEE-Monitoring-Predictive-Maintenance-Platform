import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'https://oee-backend-pjbu.onrender.com'
).replace(/\/+$/, '');

const AuthContext = createContext();

export const ROLE_CONFIG = {
  OPERATOR: {
    color: 'var(--green)',
    label: 'Operator',
    access: 'Assigned machine(s) only',
  },
  SUPERVISOR: {
    color: 'var(--amber)',
    label: 'Supervisor',
    access: 'All machines on Line-A',
  },
  MAINTENANCE: {
    color: '#8a7bff',
    label: 'Maintenance',
    access: 'Machine health & alerts',
  },
  MANAGER: {
    color: '#4fc3d9',
    label: 'Manager',
    access: 'All lines, all shifts, reports',
  },
  ADMIN: {
    color: 'var(--red)',
    label: 'Admin',
    access: 'Full system access',
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('oee_user');

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        localStorage.removeItem('oee_user');
      }
    }

    return null;
  });

  const [token, setToken] = useState(
    () => localStorage.getItem('oee_token') || ''
  );

  const [loginError, setLoginError] = useState('');

  const isAuthenticated = !!user;

  // Common API request helper
  const apiRequest = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, options);
    return response;
  };

  // Convert backend user data into the frontend user format
  const mapUser = (data) => ({
    id: data.id || data._id,
    _id: data._id || data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    assignedLineId: data.assignedLineId,
    assignedMachines: data.assignedMachines || [],
  });

  // Refresh the current user's profile
  const refreshUser = async (authToken = token) => {
    const currentToken =
      authToken || localStorage.getItem('oee_token');

    if (!currentToken) return;

    try {
      const response = await apiRequest('/api/users/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const userData = mapUser(data.user || data);

      setUser(userData);
      localStorage.setItem('oee_user', JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.warn('Profile refresh failed:', error.message);
    }
  };

  // Authenticate a demo user against the backend
  const authenticateWithBackend = async (demoUser) => {
    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: demoUser.email,
          password: demoUser.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `Login failed (${response.status}).`
        );
      }

      if (!data.token) {
        throw new Error('The backend did not return an authentication token.');
      }

      setToken(data.token);
      localStorage.setItem('oee_token', data.token);

      if (data.user) {
        const userData = mapUser(data.user);

        setUser(userData);
        localStorage.setItem('oee_user', JSON.stringify(userData));
      }

      return data;
    } catch (error) {
      console.error('Demo authentication failed:', error.message);
      throw error;
    }
  };

  // Assign machines to the current user
  const assignMachines = async (machineIds = [], all = false) => {
    const currentToken =
      token || localStorage.getItem('oee_token');

    try {
      const response = await apiRequest(
        '/api/users/assign-machine',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken
              ? { Authorization: `Bearer ${currentToken}` }
              : {}),
          },
          body: JSON.stringify({ machineIds, all }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Machine assignment failed (${response.status}).`
        );
      }

      if (data.user) {
        const userData = mapUser(data.user);

        setUser(userData);
        localStorage.setItem('oee_user', JSON.stringify(userData));

        return userData;
      }

      return data;
    } catch (error) {
      console.error('Failed to assign machines:', error.message);
      throw error;
    }
  };

  // Refresh the user profile when the provider mounts
  useEffect(() => {
    const savedToken = localStorage.getItem('oee_token');

    if (savedToken) {
      refreshUser(savedToken);
    }
    // Run only when the provider mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep user data synchronized with local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('oee_user', JSON.stringify(user));
    }
  }, [user]);

  // Login with email and password
  const loginWithCredentials = async (email, password) => {
    setLoginError('');

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504
        ) {
          throw new Error(
            'The backend service is temporarily unavailable. Please try again.'
          );
        }

        if (response.status === 401) {
          throw new Error(
            data.message || 'Invalid email or password.'
          );
        }

        throw new Error(
          data.message ||
            `Login failed (${response.status}). Check the backend API route.`
        );
      }

      if (!data.token) {
        throw new Error(
          'Login response did not contain an authentication token.'
        );
      }

      setToken(data.token);
      localStorage.setItem('oee_token', data.token);

      const userData = data.user
        ? mapUser(data.user)
        : {
            email: normalizedEmail,
            name: normalizedEmail,
            role: 'OPERATOR',
          };

      setUser(userData);
      localStorage.setItem('oee_user', JSON.stringify(userData));

      return data;
    } catch (error) {
      let message = error.message || 'Login failed. Please try again.';

      if (
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('Load failed')
      ) {
        message =
          'Cannot connect to the backend. Check the Render service and its CORS configuration.';
      }

      setLoginError(message);
      throw new Error(message);
    }
  };

  // Register a new account
  const registerUser = async ({
    name,
    email,
    password,
    role,
  }) => {
    setLoginError('');

    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Registration failed (${response.status}).`
        );
      }

      if (data.token && data.user) {
        setToken(data.token);
        localStorage.setItem('oee_token', data.token);

        const userData = mapUser(data.user);

        setUser(userData);
        localStorage.setItem('oee_user', JSON.stringify(userData));
      }

      return data;
    } catch (error) {
      let message =
        error.message || 'Registration failed. Please try again.';

      if (
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('Load failed')
      ) {
        message =
          'Cannot connect to the backend. Check the Render service and its CORS configuration.';
      }

      setLoginError(message);
      throw new Error(message);
    }
  };

  // Update the current user's profile
  const updateUserProfile = async ({
    name,
    email,
    assignedLineId,
    currentPassword,
    newPassword,
  }) => {
    const currentToken =
      token || localStorage.getItem('oee_token');

    if (!currentToken) {
      throw new Error('Not authenticated. Please sign in again.');
    }

    const response = await apiRequest('/api/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify({
        name,
        email,
        assignedLineId,
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Profile update failed (${response.status}).`
      );
    }

    if (data.token) {
      setToken(data.token);
      localStorage.setItem('oee_token', data.token);
    }

    if (data.user) {
      const userData = mapUser(data.user);

      setUser(userData);
      localStorage.setItem('oee_user', JSON.stringify(userData));
    }

    return data;
  };

  // Log out and clear authentication data
  const logout = () => {
    setUser(null);
    setToken('');
    setLoginError('');

    localStorage.removeItem('oee_user');
    localStorage.removeItem('oee_token');
  };

  // Check whether the current user has one of the specified roles
  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loginWithCredentials,
        authenticateWithBackend,
        registerUser,
        updateUserProfile,
        logout,
        loginError,
        hasRole,
        refreshUser,
        assignMachines,
        ROLE_CONFIG,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);