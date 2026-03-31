import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, formatApiErrorDetail } from '@/lib/api';

const AuthContext = createContext(null);
const SESSION_HINT_KEY = 'orderly_has_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // Avoid /auth/me on first load when user has never logged in on this browser.
    if (localStorage.getItem(SESSION_HINT_KEY) !== '1') {
      setUser(false);
      setLoading(false);
      return;
    }

    try {
      const { data } = await authAPI.me();
      setUser(data);
    } catch {
      localStorage.removeItem(SESSION_HINT_KEY);
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem(SESSION_HINT_KEY, '1');
      setUser(data);
      return { success: true };
    } catch (e) {
      return { success: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await authAPI.register({ name, email, password });
      localStorage.setItem(SESSION_HINT_KEY, '1');
      setUser(data);
      return { success: true };
    } catch (e) {
      return { success: false, error: formatApiErrorDetail(e.response?.data?.detail) || e.message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      localStorage.removeItem(SESSION_HINT_KEY);
      setUser(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
