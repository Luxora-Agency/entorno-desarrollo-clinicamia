/**
 * Hook para gestión de Seguridad del Paciente
 * Rondas de Seguridad, Prácticas Seguras y Adherencia
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const useSeguridadPaciente = () => {
  const [rondas, setRondas] = useState([]);
  const [practicas, setPracticas] = useState([]);
  const [adherencias, setAdherencias] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // RONDAS DE SEGURIDAD
  // ==========================================

  const fetchRondas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/seguridad-paciente/rondas', { limit: 100, ...params });
      setRondas(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getRondaById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/seguridad-paciente/rondas/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const programarRonda = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/seguridad-paciente/rondas', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRonda = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/seguridad-paciente/rondas/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const ejecutarRonda = useCallback(async (id, hallazgos, observaciones) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/seguridad-paciente/rondas/${id}/ejecutar`, {
        hallazgos,
        observaciones,
      });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelarRonda = useCallback(async (id, motivo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/seguridad-paciente/rondas/${id}/cancelar`, { motivo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRondasProgramadas = useCallback(async (fechaDesde, fechaHasta) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/seguridad-paciente/rondas', {
        estado: 'Programada',
        fechaDesde,
        fechaHasta,
      });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // PRÁCTICAS SEGURAS
  // ==========================================

  const fetchPracticas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/seguridad-paciente/practicas', params);
      setPracticas(response.data?.practicas || []);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPracticaById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/seguridad-paciente/practicas/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createPractica = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/seguridad-paciente/practicas', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePractica = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/seguridad-paciente/practicas/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPracticasPorCategoria = useCallback(async (categoria) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/seguridad-paciente/practicas', { categoria });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // ADHERENCIA A PRÁCTICAS SEGURAS
  // ==========================================

  const fetchAdherencias = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/seguridad-paciente/adherencias', { limit: 100, ...params });
      setAdherencias(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAdherenciaById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/seguridad-paciente/adherencias/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarAdherencia = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/seguridad-paciente/adherencias', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAdherenciaPorPractica = useCallback(async (practicaId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/seguridad-paciente/practicas/${practicaId}/adherencias`, params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTendenciaAdherencia = useCallback(async (practicaId, periodos = 12) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/seguridad-paciente/practicas/${practicaId}/tendencia`, { periodos });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // CHECKLISTS
  // ==========================================

  const getChecklistPractica = useCallback(async (practicaId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/seguridad-paciente/practicas/${practicaId}/checklist`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateChecklistPractica = useCallback(async (practicaId, checklist) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/seguridad-paciente/practicas/${practicaId}/checklist`, { checklist });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // DASHBOARD Y ESTADÍSTICAS
  // ==========================================

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/seguridad-paciente/dashboard');
      setDashboard(response.data?.dashboard || null);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasRondas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/seguridad-paciente/estadisticas/rondas', params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasAdherencia = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/seguridad-paciente/estadisticas/adherencia', params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getResumenAdherencias = useCallback(async (periodo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/seguridad-paciente/adherencias/resumen', { periodo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estado
    rondas,
    practicas,
    adherencias,
    dashboard,
    loading,
    error,
    // Rondas
    fetchRondas,
    getRondaById,
    programarRonda,
    updateRonda,
    ejecutarRonda,
    cancelarRonda,
    fetchRondasProgramadas,
    // Prácticas
    fetchPracticas,
    getPracticaById,
    createPractica,
    updatePractica,
    fetchPracticasPorCategoria,
    // Adherencias
    fetchAdherencias,
    getAdherenciaById,
    registrarAdherencia,
    getAdherenciaPorPractica,
    getTendenciaAdherencia,
    // Checklists
    getChecklistPractica,
    updateChecklistPractica,
    // Dashboard
    fetchDashboard,
    getEstadisticasRondas,
    getEstadisticasAdherencia,
    getResumenAdherencias,
  };
};
