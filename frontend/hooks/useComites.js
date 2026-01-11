/**
 * Hook para gestión de Comités Institucionales
 * Comités obligatorios según normativa colombiana
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const useComites = () => {
  const [comites, setComites] = useState([]);
  const [reuniones, setReuniones] = useState([]);
  const [compromisos, setCompromisos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // COMITÉS
  // ==========================================

  const fetchComites = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/comites', params);
      setComites(response.data?.comites || []);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getComiteById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/comites/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createComite = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/comites', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateComite = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/comites/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteComite = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiDelete(`/comites/${id}`);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // INTEGRANTES
  // ==========================================

  const getIntegrantes = useCallback(async (comiteId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/comites/${comiteId}/integrantes`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const addIntegrante = useCallback(async (comiteId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/comites/${comiteId}/integrantes`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateIntegrante = useCallback(async (comiteId, integranteId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/comites/${comiteId}/integrantes/${integranteId}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const retirarIntegrante = useCallback(async (comiteId, integranteId, motivo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/comites/${comiteId}/integrantes/${integranteId}/retirar`, { motivo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // REUNIONES
  // ==========================================

  const fetchReuniones = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/comites/reuniones', { limit: 100, ...params });
      setReuniones(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getReunionesComite = useCallback(async (comiteId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/comites/${comiteId}/reuniones`, params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getReunionById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/comites/reuniones/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const programarReunion = useCallback(async (comiteId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/comites/${comiteId}/reuniones`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReunion = useCallback(async (reunionId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/comites/reuniones/${reunionId}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarRealizacion = useCallback(async (reunionId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/comites/reuniones/${reunionId}/realizar`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelarReunion = useCallback(async (reunionId, motivo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/comites/reuniones/${reunionId}/cancelar`, { motivo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarActaReunion = useCallback(async (reunionId, actaUrl) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/comites/reuniones/${reunionId}/acta`, { actaUrl });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // COMPROMISOS
  // ==========================================

  const fetchCompromisos = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/comites/compromisos', { limit: 100, ...params });
      setCompromisos(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCompromisosReunion = useCallback(async (reunionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/comites/reuniones/${reunionId}/compromisos`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createCompromiso = useCallback(async (reunionId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/comites/reuniones/${reunionId}/compromisos`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompromiso = useCallback(async (compromisoId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/comites/compromisos/${compromisoId}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const cerrarCompromiso = useCallback(async (compromisoId, observacion) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/comites/compromisos/${compromisoId}/cerrar`, { observacion });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompromisosPendientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/comites/compromisos', { estado: 'Pendiente', limit: 50 });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompromisosPorResponsable = useCallback(async (responsableId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/comites/compromisos/por-responsable/${responsableId}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // ALERTAS
  // ==========================================

  const fetchCompromisosVencidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/comites/compromisos/alertas/vencidos');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCompromisosPorVencer = useCallback(async (dias = 7) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/comites/compromisos/alertas/por-vencer', { dias });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProximasReuniones = useCallback(async (dias = 30) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/comites/reuniones/proximas', { dias });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // DASHBOARD
  // ==========================================

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/comites/dashboard');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasReuniones = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/comites/estadisticas/reuniones', params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCumplimientoPeriodicidad = useCallback(async (anio) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/comites/estadisticas/cumplimiento', { anio });
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
    comites,
    reuniones,
    compromisos,
    loading,
    error,
    // Comités
    fetchComites,
    getComiteById,
    createComite,
    updateComite,
    deleteComite,
    // Integrantes
    getIntegrantes,
    addIntegrante,
    updateIntegrante,
    retirarIntegrante,
    // Reuniones
    fetchReuniones,
    getReunionesComite,
    getReunionById,
    programarReunion,
    updateReunion,
    registrarRealizacion,
    cancelarReunion,
    cargarActaReunion,
    // Compromisos
    fetchCompromisos,
    getCompromisosReunion,
    createCompromiso,
    updateCompromiso,
    cerrarCompromiso,
    fetchCompromisosPendientes,
    fetchCompromisosPorResponsable,
    // Alertas
    fetchCompromisosVencidos,
    fetchCompromisosPorVencer,
    fetchProximasReuniones,
    // Dashboard
    fetchDashboard,
    getEstadisticasReuniones,
    getCumplimientoPeriodicidad,
  };
};
