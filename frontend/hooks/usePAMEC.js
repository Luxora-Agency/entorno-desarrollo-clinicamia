/**
 * Hook para gestión de PAMEC - Programa de Auditoría para el Mejoramiento de la Calidad
 * Implementa la Ruta Crítica de 9 pasos
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const usePAMEC = () => {
  const [equipo, setEquipo] = useState([]);
  const [procesos, setProcesos] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [auditorias, setAuditorias] = useState([]);
  const [hallazgos, setHallazgos] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // EQUIPO PAMEC
  // ==========================================

  const fetchEquipo = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pamec/equipo', params);
      setEquipo(response.data?.equipo || []);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const addMiembroEquipo = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/pamec/equipo', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMiembroEquipo = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/pamec/equipo/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const retirarMiembroEquipo = useCallback(async (id, motivo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pamec/equipo/${id}/retirar`, { motivo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // PROCESOS
  // ==========================================

  const fetchProcesos = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pamec/procesos', { limit: 100, ...params });
      setProcesos(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getProcesoById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/pamec/procesos/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createProceso = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/pamec/procesos', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProceso = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/pamec/procesos/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProceso = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiDelete(`/pamec/procesos/${id}`);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const priorizarProcesos = useCallback(async (procesoIds) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/pamec/procesos/priorizar', { procesoIds });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // INDICADORES PAMEC
  // ==========================================

  const fetchIndicadores = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pamec/indicadores', { limit: 100, ...params });
      setIndicadores(response.data?.indicadores || []);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getIndicadorById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/pamec/indicadores/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createIndicador = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/pamec/indicadores', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateIndicador = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/pamec/indicadores/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // MEDICIONES
  // ==========================================

  const getMedicionesIndicador = useCallback(async (indicadorId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/pamec/indicadores/${indicadorId}/tendencia`, params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarMedicion = useCallback(async (indicadorId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pamec/indicadores/${indicadorId}/medicion`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // AUDITORÍAS
  // ==========================================

  const fetchAuditorias = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pamec/auditorias', { limit: 100, ...params });
      setAuditorias(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAuditoriaById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/pamec/auditorias/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createAuditoria = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/pamec/auditorias', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAuditoria = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/pamec/auditorias/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const ejecutarAuditoria = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pamec/auditorias/${id}/ejecutar`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const finalizarAuditoria = useCallback(async (id, conclusiones) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pamec/auditorias/${id}/finalizar`, { conclusiones });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // HALLAZGOS
  // ==========================================

  const fetchHallazgos = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pamec/hallazgos', { limit: 100, ...params });
      setHallazgos(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getHallazgoById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/pamec/hallazgos/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createHallazgo = useCallback(async (auditoriaId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pamec/auditorias/${auditoriaId}/hallazgos`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateHallazgo = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/pamec/hallazgos/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const cerrarHallazgo = useCallback(async (id, observaciones) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pamec/hallazgos/${id}/cerrar`, { observaciones });
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

  const registrarAnalisisCausa = useCallback(async (hallazgoId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/pamec/hallazgos/${hallazgoId}/analisis-causa`, data);
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
      const response = await apiGet('/pamec/dashboard');
      setDashboard(response.data?.dashboard || null);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getRutaCritica = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pamec/ruta-critica');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getMatrizPriorizacion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/pamec/procesos/priorizacion');
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
    equipo,
    procesos,
    indicadores,
    auditorias,
    hallazgos,
    dashboard,
    loading,
    error,
    // Equipo
    fetchEquipo,
    addMiembroEquipo,
    updateMiembroEquipo,
    retirarMiembroEquipo,
    // Procesos
    fetchProcesos,
    getProcesoById,
    createProceso,
    updateProceso,
    deleteProceso,
    priorizarProcesos,
    // Indicadores
    fetchIndicadores,
    getIndicadorById,
    createIndicador,
    updateIndicador,
    getMedicionesIndicador,
    registrarMedicion,
    // Auditorías
    fetchAuditorias,
    getAuditoriaById,
    createAuditoria,
    updateAuditoria,
    ejecutarAuditoria,
    finalizarAuditoria,
    // Hallazgos
    fetchHallazgos,
    getHallazgoById,
    createHallazgo,
    updateHallazgo,
    cerrarHallazgo,
    registrarAnalisisCausa,
    // Dashboard
    fetchDashboard,
    getRutaCritica,
    getMatrizPriorizacion,
  };
};
