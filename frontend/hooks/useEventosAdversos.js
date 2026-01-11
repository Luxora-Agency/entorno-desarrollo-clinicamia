/**
 * Hook para gestión de Eventos Adversos y Análisis Causa Raíz
 * Seguridad del Paciente - Resolución 3100/2019
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const useEventosAdversos = () => {
  const [eventos, setEventos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // EVENTOS ADVERSOS
  // ==========================================

  const fetchEventos = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/eventos-adversos', { limit: 100, ...params });
      setEventos(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEventoById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/eventos-adversos/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const reportarEvento = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/eventos-adversos', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEvento = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/eventos-adversos/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const cambiarEstadoEvento = useCallback(async (id, estado, observaciones) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/eventos-adversos/${id}/estado`, { estado, observaciones });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // ANÁLISIS CAUSA RAÍZ
  // ==========================================

  const getAnalisisCausaRaiz = useCallback(async (eventoId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/eventos-adversos/${eventoId}/analisis`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const iniciarAnalisisCausaRaiz = useCallback(async (eventoId, metodo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/eventos-adversos/${eventoId}/analisis`, { metodo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAnalisisCausaRaiz = useCallback(async (eventoId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/eventos-adversos/${eventoId}/analisis`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const finalizarAnalisis = useCallback(async (eventoId, conclusiones, recomendaciones) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/eventos-adversos/${eventoId}/analisis/finalizar`, {
        conclusiones,
        recomendaciones,
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
  // FACTORES CONTRIBUTIVOS
  // ==========================================

  const getFactoresContributivos = useCallback(async (eventoId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/eventos-adversos/${eventoId}/factores`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const addFactorContributivo = useCallback(async (eventoId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/eventos-adversos/${eventoId}/factores`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFactorContributivo = useCallback(async (eventoId, factorId) => {
    try {
      setLoading(true);
      setError(null);
      await apiDelete(`/eventos-adversos/${eventoId}/factores/${factorId}`);
      return { success: true };
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

  const fetchEventosPorTipo = useCallback(async (tipo, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/eventos-adversos', { tipoEvento: tipo, ...params });
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEventosPorSeveridad = useCallback(async (severidad, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/eventos-adversos', { severidad, ...params });
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEventosPendientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/eventos-adversos', { estado: 'Reportado', limit: 50 });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEventosCentinela = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/eventos-adversos', { severidad: 'CENTINELA', ...params });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // ESTADÍSTICAS Y REPORTES
  // ==========================================

  const fetchEstadisticas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/eventos-adversos/estadisticas', params);
      setEstadisticas(response.data?.estadisticas || null);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasPorServicio = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/eventos-adversos/estadisticas/por-servicio', params);
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
      const response = await apiGet('/eventos-adversos/estadisticas/por-tipo', params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getTendencias = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/eventos-adversos/estadisticas/tendencias', params);
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
      const response = await apiGet('/eventos-adversos/dashboard');
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
    eventos,
    estadisticas,
    loading,
    error,
    // Eventos
    fetchEventos,
    getEventoById,
    reportarEvento,
    updateEvento,
    cambiarEstadoEvento,
    // Análisis Causa Raíz
    getAnalisisCausaRaiz,
    iniciarAnalisisCausaRaiz,
    updateAnalisisCausaRaiz,
    finalizarAnalisis,
    // Factores Contributivos
    getFactoresContributivos,
    addFactorContributivo,
    deleteFactorContributivo,
    // Filtros
    fetchEventosPorTipo,
    fetchEventosPorSeveridad,
    fetchEventosPendientes,
    fetchEventosCentinela,
    // Estadísticas
    fetchEstadisticas,
    getEstadisticasPorServicio,
    getEstadisticasPorTipo,
    getTendencias,
    fetchDashboard,
  };
};
