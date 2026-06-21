import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

axios.defaults.baseURL = '';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(r => setUser(r.data))
        .catch(() => setAuthToken(null))
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  // Axios response interceptor for 401
  useEffect(() => {
    const id = axios.interceptors.response.use(
      r => r,
      err => {
        if (err.response?.status === 401 && localStorage.getItem('token')) {
          setAuthToken(null); setUser(null);
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await axios.post('/api/auth/login', { email, password });
    setAuthToken(r.data.token);
    setUser({ id: r.data.id, email: r.data.email, name: r.data.name, role: r.data.role, avatar_color: r.data.avatar_color });
    return r.data.role;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const r = await axios.get('/api/auth/me');
    setUser(r.data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
