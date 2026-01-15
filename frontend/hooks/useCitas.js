/**
 * Hook para gestión de citas
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const useCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCitas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/citas', { limit: 100, ...params });
      setCitas(response.data || []);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCitaById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/citas/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createCita = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/citas', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCita = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/citas/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCita = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiDelete(`/citas/${id}`);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDisponibilidad = useCallback(async (doctorId, fecha) => {
    try {
      setLoading(true);
      setError(null);
      console.log('[useCitas] Consultando disponibilidad:', { doctorId, fecha });
      const response = await apiGet(`/disponibilidad/${doctorId}`, { fecha });
      console.log('[useCitas] Respuesta disponibilidad:', {
        horarios_configurados: response.data?.horarios_configurados,
        bloques_del_dia: response.data?.bloques_del_dia,
        bloqueado: response.data?.bloqueado,
        slots_disponibles: response.data?.slots_disponibles?.length || 0
      });
      return { success: true, data: response.data };
    } catch (err) {
      console.error('[useCitas] Error disponibilidad:', err.message);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const validarDisponibilidad = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/disponibilidad/validar', data);
      return { success: true, data: response };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    citas,
    loading,
    error,
    fetchCitas,
    getCitaById,
    createCita,
    updateCita,
    deleteCita,
    fetchDisponibilidad,
    validarDisponibilidad,
  };
};
