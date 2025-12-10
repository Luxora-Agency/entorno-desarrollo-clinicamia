/**
 * Hook para gestión de pacientes
 */
import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const usePacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPacientes = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pacientes', { limit: 100, ...params });
      setPacientes(response.data || []);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPacientes = useCallback(async (query) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pacientes/search', { q: query });
      return { success: true, data: response.data || [] };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPacienteById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/pacientes/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createPaciente = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/pacientes', data);
      await fetchPacientes(); // Refrescar lista
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPacientes]);

  const updatePaciente = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/pacientes/${id}`, data);
      await fetchPacientes(); // Refrescar lista
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPacientes]);

  const deletePaciente = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiDelete(`/pacientes/${id}`);
      await fetchPacientes(); // Refrescar lista
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchPacientes]);

  return {
    pacientes,
    loading,
    error,
    fetchPacientes,
    searchPacientes,
    getPacienteById,
    createPaciente,
    updatePaciente,
    deletePaciente,
  };
};
