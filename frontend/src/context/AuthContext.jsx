import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 1,
    username: "analyst",
    full_name: "Security Analyst",
    role: "Senior SOC Analyst"
  });
  const [token, setToken] = useState(localStorage.getItem('hg_token') || 'demo_token');
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    try {
      const data = await api.login(username, password);
      localStorage.setItem('hg_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('hg_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
