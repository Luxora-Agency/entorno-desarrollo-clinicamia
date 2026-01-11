/**
 * Hook para gestión de PQRS
 * Peticiones, Quejas, Reclamos, Sugerencias - Ley 1755/2015
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const usePQRS = () => {
  const [pqrs, setPqrs] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // PQRS - CRUD
  // ==========================================

  const fetchPQRS = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs', { limit: 100, ...params });
      setPqrs(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPQRSById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/pqrs/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPQRSByRadicado = useCallback(async (radicado) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs', { radicado });
      return { success: true, data: response.data?.[0] || null };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createPQRS = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/pqrs', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePQRS = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/pqrs/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePQRS = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiDelete(`/pqrs/${id}`);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // GESTIÓN DE ESTADOS
  // ==========================================

  const asignarResponsable = useCallback(async (id, responsableId, areaAsignada) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pqrs/${id}/asignar`, { responsableId, areaAsignada });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const responderPQRS = useCallback(async (id, respuesta, archivoRespuesta = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pqrs/${id}/responder`, { respuesta, archivoRespuesta });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const cerrarPQRS = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pqrs/${id}/cerrar`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const reabrirPQRS = useCallback(async (id, motivo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pqrs/${id}/reabrir`, { motivo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // SEGUIMIENTOS
  // ==========================================

  const getSeguimientos = useCallback(async (pqrsId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/pqrs/${pqrsId}/seguimientos`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const addSeguimiento = useCallback(async (pqrsId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pqrs/${pqrsId}/seguimientos`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // ENCUESTAS DE SATISFACCIÓN
  // ==========================================

  const enviarEncuestaSatisfaccion = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pqrs/${id}/encuesta`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarCalificacion = useCallback(async (id, calificacion, comentario) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pqrs/${id}/calificacion`, { calificacion, comentario });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // FILTROS Y BÚSQUEDAS
  // ==========================================

  const fetchPQRSPorTipo = useCallback(async (tipo, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs', { tipo, ...params });
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPQRSPorEstado = useCallback(async (estado, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs', { estado, ...params });
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPQRSPorResponsable = useCallback(async (responsableId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/pqrs/por-responsable/${responsableId}`, params);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPQRSPendientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs', { estado: 'Radicada', limit: 50 });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // ALERTAS Y VENCIMIENTOS
  // ==========================================

  const fetchPQRSPorVencer = useCallback(async (dias = 3) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs/alertas/por-vencer', { dias });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPQRSVencidas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs/alertas/vencidas');
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
      const response = await apiGet('/pqrs/dashboard');
      setDashboard(response.data?.dashboard || null);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasPorTipo = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs/estadisticas/por-tipo', params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasPorCanal = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs/estadisticas/por-canal', params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasTiemposRespuesta = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs/estadisticas/tiempos-respuesta', params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasSatisfaccion = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pqrs/estadisticas/satisfaccion', params);
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
    pqrs,
    dashboard,
    loading,
    error,
    // CRUD
    fetchPQRS,
    getPQRSById,
    getPQRSByRadicado,
    createPQRS,
    updatePQRS,
    deletePQRS,
    // Gestión
    asignarResponsable,
    responderPQRS,
    cerrarPQRS,
    reabrirPQRS,
    // Seguimientos
    getSeguimientos,
    addSeguimiento,
    // Encuestas
    enviarEncuestaSatisfaccion,
    registrarCalificacion,
    // Filtros
    fetchPQRSPorTipo,
    fetchPQRSPorEstado,
    fetchPQRSPorResponsable,
    fetchPQRSPendientes,
    // Alertas
    fetchPQRSPorVencer,
    fetchPQRSVencidas,
    // Dashboard
    fetchDashboard,
    getEstadisticasPorTipo,
    getEstadisticasPorCanal,
    getEstadisticasTiemposRespuesta,
    getEstadisticasSatisfaccion,
  };
};
