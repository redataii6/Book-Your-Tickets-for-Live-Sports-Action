import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('access');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me/');
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password });
    localStorage.setItem('access',  data.access);
    localStorage.setItem('refresh', data.refresh);
    const me = await api.get('/auth/me/');
    setUser(me.data);
    return me.data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register/', formData);
    localStorage.setItem('access',  data.access);
    localStorage.setItem('refresh', data.refresh);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
