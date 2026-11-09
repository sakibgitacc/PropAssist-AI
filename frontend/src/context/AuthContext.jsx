import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('propassist_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('propassist_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('propassist_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('propassist_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('propassist_token', newToken);
        localStorage.setItem('propassist_user', JSON.stringify(newUser));
        return { success: true, user: newUser };
      }
      return { success: false, error: res.data.error || 'Login failed' };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Connection error. Is the backend running?' };
    }
  };

  const register = async (name, email, password, phone, autoLogin = false) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, phone });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        if (autoLogin) {
          setToken(newToken);
          setUser(newUser);
          localStorage.setItem('propassist_token', newToken);
          localStorage.setItem('propassist_user', JSON.stringify(newUser));
        }
        return { success: true, user: newUser };
      }
      return { success: false, error: res.data.error || 'Registration failed' };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('propassist_token');
    localStorage.removeItem('propassist_user');
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
