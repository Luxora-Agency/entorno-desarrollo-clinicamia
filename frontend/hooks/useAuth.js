/**
 * Hook para manejo de autenticación
 */
import { useState, useEffect } from 'react';
import { apiPost } from '@/services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar si hay un usuario en localStorage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiPost('/auth/login', { email, password });
      
      if (response.success && response.data) {
        const { token, usuario } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(usuario));
        setUser(usuario);
        
        return { success: true, user: usuario };
      }
      
      throw new Error('Credenciales inválidas');
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
  };
};
