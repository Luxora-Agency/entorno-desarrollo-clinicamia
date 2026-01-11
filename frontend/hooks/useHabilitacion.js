/**
 * Hook para gestión de Habilitación (SUH) - Resolución 3100/2019
 * Sistema Único de Habilitación
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const useHabilitacion = () => {
  const [estandares, setEstandares] = useState([]);
  const [autoevaluaciones, setAutoevaluaciones] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // ESTÁNDARES
  // ==========================================

  const fetchEstandares = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/habilitacion/estandares', params);
      setEstandares(response.data?.estandares || []);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstandarById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/habilitacion/estandares/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCriteriosByEstandar = useCallback(async (estandarId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/habilitacion/estandares/${estandarId}/criterios`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // AUTOEVALUACIONES
  // ==========================================

  const fetchAutoevaluaciones = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/habilitacion/autoevaluaciones', { limit: 100, ...params });
      setAutoevaluaciones(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAutoevaluacionById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/habilitacion/autoevaluaciones/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createAutoevaluacion = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/habilitacion/autoevaluaciones', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAutoevaluacion = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/habilitacion/autoevaluaciones/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // EVALUACIÓN DE CRITERIOS
  // ==========================================

  const evaluarCriterio = useCallback(async (autoevaluacionId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/habilitacion/autoevaluaciones/${autoevaluacionId}/criterios`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEvaluacionesCriterios = useCallback(async (autoevaluacionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/habilitacion/autoevaluaciones/${autoevaluacionId}/criterios`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // VISITAS DE VERIFICACIÓN
  // ==========================================

  const fetchVisitas = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/habilitacion/visitas', { limit: 100, ...params });
      setVisitas(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getVisitaById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/habilitacion/visitas/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createVisita = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/habilitacion/visitas', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVisita = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/habilitacion/visitas/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarHallazgosVisita = useCallback(async (visitaId, hallazgos) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/habilitacion/visitas/${visitaId}/hallazgos`, { hallazgos });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // DASHBOARD Y REPORTES
  // ==========================================

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/habilitacion/dashboard');
      setDashboard(response.data?.dashboard || null);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getReporteAutoevaluacion = useCallback(async (autoevaluacionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/habilitacion/autoevaluaciones/${autoevaluacionId}/reporte`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // EXPORTACIÓN REPS
  // ==========================================

  const exportarDeclaracionREPS = useCallback(async (formato = 'xml') => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/habilitacion/exportar/reps/${formato}`);
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
    estandares,
    autoevaluaciones,
    visitas,
    dashboard,
    loading,
    error,
    // Estándares
    fetchEstandares,
    getEstandarById,
    getCriteriosByEstandar,
    // Autoevaluaciones
    fetchAutoevaluaciones,
    getAutoevaluacionById,
    createAutoevaluacion,
    updateAutoevaluacion,
    // Criterios
    evaluarCriterio,
    getEvaluacionesCriterios,
    // Visitas
    fetchVisitas,
    getVisitaById,
    createVisita,
    updateVisita,
    registrarHallazgosVisita,
    // Dashboard y reportes
    fetchDashboard,
    getReporteAutoevaluacion,
    exportarDeclaracionREPS,
  };
};
