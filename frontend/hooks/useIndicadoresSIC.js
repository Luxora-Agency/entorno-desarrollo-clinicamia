/**
 * Hook para gestión de Indicadores SIC - Resolución 256/2016
 * Sistema de Información para la Calidad
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut } from '@/services/api';

export const useIndicadoresSIC = () => {
  const [indicadores, setIndicadores] = useState([]);
  const [mediciones, setMediciones] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // INDICADORES (CATÁLOGO)
  // ==========================================

  const fetchIndicadores = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/indicadores-sic', params);
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
      const response = await apiGet(`/indicadores-sic/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getIndicadorByCodigo = useCallback(async (codigo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/indicadores-sic', { codigo });
      return { success: true, data: response.data?.indicadores?.[0] || null };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIndicadoresPorDominio = useCallback(async (dominio) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/indicadores-sic', { dominio });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMetaInstitucional = useCallback(async (id, meta) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/indicadores-sic/${id}`, { metaInstitucional: meta });
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

  const fetchMediciones = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/indicadores-sic/mediciones', { limit: 100, ...params });
      setMediciones(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getMedicionById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/indicadores-sic/mediciones/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarMedicion = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/indicadores-sic/mediciones', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMedicion = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/indicadores-sic/mediciones/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getMedicionesPorIndicador = useCallback(async (indicadorId, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/indicadores-sic/${indicadorId}/mediciones`, params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getMedicionesPorPeriodo = useCallback(async (periodo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/indicadores-sic/mediciones', { periodo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // TENDENCIAS Y ANÁLISIS
  // ==========================================

  const getTendenciaIndicador = useCallback(async (indicadorId, periodos = 6) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/indicadores-sic/${indicadorId}/tendencia`, { periodos });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getComparativoMetas = useCallback(async (periodo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/indicadores-sic/comparativo-metas', { periodo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getSemaforoIndicadores = useCallback(async (periodo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/indicadores-sic/semaforos/${periodo}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // REPORTE SISPRO
  // ==========================================

  const marcarReportadoSISPRO = useCallback(async (medicionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/indicadores-sic/marcar-reportado/${medicionId}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getMedicionesPendientesSISPRO = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/indicadores-sic/mediciones', { reportadoSISPRO: false });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // EXPORTACIÓN
  // ==========================================

  const exportarReporteSISPRO = useCallback(async (periodo, formato = 'xml') => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/indicadores-sic/exportar/sispro-xml/${periodo}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const exportarPlantillaPISIS = useCallback(async (periodo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/indicadores-sic/exportar/pisis/${periodo}`);
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

  const fetchDashboard = useCallback(async (periodo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/indicadores-sic/dashboard/resumen', { periodo });
      setDashboard(response.data?.dashboard || null);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getResumenPorDominio = useCallback(async (periodo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/indicadores-sic/resumen-dominio', { periodo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getIndicadoresCriticos = useCallback(async (periodo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/indicadores-sic/criticos', { periodo });
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
    indicadores,
    mediciones,
    dashboard,
    loading,
    error,
    // Indicadores
    fetchIndicadores,
    getIndicadorById,
    getIndicadorByCodigo,
    fetchIndicadoresPorDominio,
    updateMetaInstitucional,
    // Mediciones
    fetchMediciones,
    getMedicionById,
    registrarMedicion,
    updateMedicion,
    getMedicionesPorIndicador,
    getMedicionesPorPeriodo,
    // Tendencias
    getTendenciaIndicador,
    getComparativoMetas,
    getSemaforoIndicadores,
    // SISPRO
    marcarReportadoSISPRO,
    getMedicionesPendientesSISPRO,
    // Exportación
    exportarReporteSISPRO,
    exportarPlantillaPISIS,
    // Dashboard
    fetchDashboard,
    getResumenPorDominio,
    getIndicadoresCriticos,
  };
};
