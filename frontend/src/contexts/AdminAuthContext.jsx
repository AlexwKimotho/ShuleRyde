import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../services/api';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdmin = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await adminAPI.getMe();
      setAdmin(data.admin);
    } catch {
      localStorage.removeItem('admin_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAdmin(); }, [loadAdmin]);

  const signin = async (formData) => {
    const { data } = await adminAPI.signin(formData);
    localStorage.setItem('admin_token', data.token);
    setAdmin(data.admin);
    return data;
  };

  const signout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, signin, signout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};
