/**
 * Hook para gestión de Planes de Acción de Calidad
 * Módulo transversal para gestión de planes de mejora
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const usePlanesAccion = () => {
  const [planes, setPlanes] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // PLANES DE ACCIÓN - CRUD
  // ==========================================

  const fetchPlanes = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/planes-accion', { limit: 100, ...params });
      setPlanes(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getPlanById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/planes-accion/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlan = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/planes-accion', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlan = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/planes-accion/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlan = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiDelete(`/planes-accion/${id}`);
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

  const cerrarPlan = useCallback(async (id, resultadoObtenido, eficaciaVerificada) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/planes-accion/${id}/cerrar`, {
        resultadoObtenido,
        eficaciaVerificada,
      });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const reabrirPlan = useCallback(async (id, motivo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/planes-accion/${id}/reabrir`, { motivo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const verificarEficacia = useCallback(async (id, eficaz, observaciones) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/planes-accion/${id}/verificar-eficacia`, {
        eficaz,
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

  // ==========================================
  // SEGUIMIENTOS
  // ==========================================

  const getSeguimientos = useCallback(async (planId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/planes-accion/${planId}/seguimientos`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarSeguimiento = useCallback(async (planId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/planes-accion/${planId}/seguimientos`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // EVIDENCIAS
  // ==========================================

  const getEvidencias = useCallback(async (planId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/planes-accion/${planId}/evidencias`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarEvidencia = useCallback(async (planId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/planes-accion/${planId}/evidencias`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarEvidencia = useCallback(async (planId, evidenciaId) => {
    try {
      setLoading(true);
      setError(null);
      await apiDelete(`/planes-accion/${planId}/evidencias/${evidenciaId}`);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // FILTROS POR ORIGEN
  // ==========================================

  const fetchPlanesPorOrigen = useCallback(async (origen, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/planes-accion/por-origen/${origen}`, params);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlanesPorResponsable = useCallback(async (responsableId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/planes-accion/por-responsable/${responsableId}`, params);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlanesPorEstado = useCallback(async (estado, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/planes-accion', { estado, ...params });
      return { success: true, data: response.data, pagination: response.pagination };
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

  const fetchPlanesVencidos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/planes-accion/alertas/vencidos');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlanesPorVencer = useCallback(async (dias = 7) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/planes-accion/alertas/por-vencer', { dias });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlanesSinSeguimiento = useCallback(async (dias = 15) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/planes-accion/alertas/sin-seguimiento', { dias });
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
      const response = await apiGet('/planes-accion/dashboard/resumen');
      setDashboard(response.data?.dashboard || null);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasPorOrigen = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/planes-accion/estadisticas/por-origen');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasPorEstado = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/planes-accion/estadisticas/por-estado');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasEfectividad = useCallback(async (fechaDesde, fechaHasta) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/planes-accion/estadisticas/efectividad', {
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

  const getEstadisticasCumplimiento = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/planes-accion/estadisticas/cumplimiento', params);
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
    planes,
    dashboard,
    loading,
    error,
    // CRUD
    fetchPlanes,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    // Gestión estados
    cerrarPlan,
    reabrirPlan,
    verificarEficacia,
    // Seguimientos
    getSeguimientos,
    registrarSeguimiento,
    // Evidencias
    getEvidencias,
    cargarEvidencia,
    eliminarEvidencia,
    // Filtros
    fetchPlanesPorOrigen,
    fetchPlanesPorResponsable,
    fetchPlanesPorEstado,
    // Alertas
    fetchPlanesVencidos,
    fetchPlanesPorVencer,
    fetchPlanesSinSeguimiento,
    // Dashboard
    fetchDashboard,
    getEstadisticasPorOrigen,
    getEstadisticasPorEstado,
    getEstadisticasEfectividad,
    getEstadisticasCumplimiento,
  };
};
