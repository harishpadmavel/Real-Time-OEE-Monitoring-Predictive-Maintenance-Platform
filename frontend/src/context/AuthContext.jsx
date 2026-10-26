import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'https://oee-backend-pjpu.onrender.com'
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

// All API requests go directly to the Render backend.
async function apiRequest(path, options = {}) {
  const url = `${API_URL}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
}

// Normalize user objects returned by the backend.
function mapUser(data) {
  return {
    ...data,
    id: data.id || data._id,
    _id: data._id || data.id,
    assignedMachines: data.assignedMachines || [],
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('oee_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('oee_user');
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem('oee_token') || ''
  );

  const [loginError, setLoginError] = useState('');

  const isAuthenticated = Boolean(user);

  // Save authenticated user data.
  const saveSession = (userData, authToken) => {
    const normalizedUser = mapUser(userData);

    setUser(normalizedUser);
    setToken(authToken);

    localStorage.setItem(
      'oee_user',
      JSON.stringify(normalizedUser)
    );

    localStorage.setItem('oee_token', authToken);

    return normalizedUser;
  };

  // Refresh the logged-in user's profile.
  const refreshUser = async (authToken = token) => {
    const currentToken =
      authToken || localStorage.getItem('oee_token');

    if (!currentToken) return null;

    try {
      const response = await apiRequest('/api/users/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        console.warn(
          'Profile refresh failed:',
          response.status
        );
        return null;
      }

      const data = await response.json();
      const userData = mapUser(data.user || data);

      setUser(userData);

      localStorage.setItem(
        'oee_user',
        JSON.stringify(userData)
      );

      return userData;
    } catch (error) {
      console.error(
        'Profile refresh failed:',
        error.message
      );
      return null;
    }
  };

  // Login using email and password.
  const loginWithCredentials = async (email, password) => {
    setLoginError('');

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await apiRequest(
        '/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            data.message || 'Invalid email or password.'
          );
        }

        if (response.status === 404) {
          throw new Error(
            'Login route not found on the Render backend.'
          );
        }

        if (response.status === 405) {
          throw new Error(
            'The backend rejected the login method. Check the deployed API route.'
          );
        }

        throw new Error(
          data.message ||
            `Login failed with status ${response.status}.`
        );
      }

      if (!data.token || !data.user) {
        throw new Error(
          'The backend login response must contain a user and token.'
        );
      }

      saveSession(data.user, data.token);

      return data;
    } catch (error) {
      let message =
        error.message || 'Login failed. Please try again.';

      if (
        error instanceof TypeError ||
        message.includes('Failed to fetch')
      ) {
        message =
          'Cannot reach Render. Check the backend service and CORS settings.';
      }

      setLoginError(message);
      throw new Error(message);
    }
  };

  // Register a new account.
  const registerUser = async ({
    name,
    email,
    password,
    role,
  }) => {
    setLoginError('');

    try {
      const response = await apiRequest(
        '/api/auth/register',
        {
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
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Registration failed with status ${response.status}.`
        );
      }

      if (data.token && data.user) {
        saveSession(data.user, data.token);
      }

      return data;
    } catch (error) {
      setLoginError(
        error.message || 'Registration failed.'
      );
      throw error;
    }
  };

  // Authenticate a demo account through the backend.
  const authenticateWithBackend = async (demoUser) => {
    return loginWithCredentials(
      demoUser.email,
      demoUser.password
    );
  };

  // Assign machines to the current user.
  const assignMachines = async (
    machineIds = [],
    all = false
  ) => {
    const currentToken =
      token || localStorage.getItem('oee_token');

    if (!currentToken) {
      throw new Error('Please sign in first.');
    }

    const response = await apiRequest(
      '/api/users/assign-machine',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          machineIds,
          all,
        }),
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

      localStorage.setItem(
        'oee_user',
        JSON.stringify(userData)
      );

      return userData;
    }

    return data;
  };

  // Restore the profile on application startup.
  useEffect(() => {
    const savedToken = localStorage.getItem('oee_token');

    if (savedToken) {
      refreshUser(savedToken);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep local storage synchronized with user state.
  useEffect(() => {
    if (user) {
      localStorage.setItem(
        'oee_user',
        JSON.stringify(user)
      );
    }
  }, [user]);

  // Update the user's profile.
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
      throw new Error('Please sign in again.');
    }

    const response = await apiRequest(
      '/api/users/profile',
      {
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
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
          `Profile update failed (${response.status}).`
      );
    }

    if (data.token && data.user) {
      saveSession(data.user, data.token);
    } else if (data.user) {
      const userData = mapUser(data.user);

      setUser(userData);

      localStorage.setItem(
        'oee_user',
        JSON.stringify(userData)
      );
    }

    return data;
  };

  // Sign out.
  const logout = () => {
    setUser(null);
    setToken('');
    setLoginError('');

    localStorage.removeItem('oee_user');
    localStorage.removeItem('oee_token');
  };

  // Check the current user's role.
  const hasRole = (...roles) => {
    return Boolean(user && roles.includes(user.role));
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