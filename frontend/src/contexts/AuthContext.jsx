import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [operator, setOperator] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      setOperator(data.operator);
    } catch {
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signup = async (formData) => {
    const { data } = await authAPI.signup(formData);
    localStorage.setItem('auth_token', data.token);
    setOperator(data.operator);
    return data;
  };

  const signin = async (formData) => {
    const { data } = await authAPI.signin(formData);
    localStorage.setItem('auth_token', data.token);
    setOperator(data.operator);
    return data;
  };

  const signout = () => {
    localStorage.removeItem('auth_token');
    setOperator(null);
  };

  return (
    <AuthContext.Provider value={{ operator, loading, signup, signin, signout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
