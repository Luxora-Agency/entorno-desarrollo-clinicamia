/**
 * Hook para gestión de Acreditación (SUA) - Resolución 5095/2018
 * Sistema Único de Acreditación - 8 grupos de estándares
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut } from '@/services/api';

export const useAcreditacion = () => {
  const [estandares, setEstandares] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // ESTÁNDARES DE ACREDITACIÓN
  // ==========================================

  const fetchEstandares = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/acreditacion/estandares', params);
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
      const response = await apiGet(`/acreditacion/estandares/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createEstandar = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/acreditacion/estandares', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEstandar = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/acreditacion/estandares/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEstandaresPorGrupo = useCallback(async (grupo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/acreditacion/estandares', { grupo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // GRUPOS DE ESTÁNDARES
  // ==========================================

  const getGruposEstandares = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/acreditacion/grupos/lista');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // EVALUACIONES
  // ==========================================

  const fetchEvaluaciones = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/acreditacion/evaluaciones', { limit: 100, ...params });
      setEvaluaciones(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEvaluacionById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/acreditacion/evaluaciones/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarEvaluacion = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/acreditacion/evaluaciones', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEvaluacion = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/acreditacion/evaluaciones/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // AUTOEVALUACIÓN POR GRUPO
  // ==========================================

  const getAutoevaluacionPorGrupo = useCallback(async (grupo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/acreditacion/autoevaluacion/${grupo}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAutoevaluacionCompleta = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const grupos = [
        'ATENCION_CLIENTE',
        'APOYO_ADMINISTRATIVO',
        'DIRECCIONAMIENTO',
        'GERENCIA',
        'RECURSO_HUMANO',
        'AMBIENTE_FISICO',
        'INFORMACION',
        'MEJORAMIENTO_CALIDAD',
      ];

      const resultados = await Promise.all(
        grupos.map(grupo =>
          apiGet(`/acreditacion/autoevaluacion/${grupo}`).catch(() => ({ data: null }))
        )
      );

      const autoevaluacion = grupos.reduce((acc, grupo, index) => {
        acc[grupo] = resultados[index].data?.autoevaluacion || null;
        return acc;
      }, {});

      return { success: true, data: autoevaluacion };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // NIVELES DE CALIFICACIÓN
  // ==========================================

  const getNivelesCalificacion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/acreditacion/niveles-calificacion');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // BRECHAS Y OPORTUNIDADES
  // ==========================================

  const getBrechasYOportunidades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/acreditacion/brechas');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // REPORTES CONSOLIDADOS
  // ==========================================

  const getReporteConsolidado = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/acreditacion/reporte-consolidado');
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
      const response = await apiGet('/acreditacion/dashboard');
      setDashboard(response.data?.dashboard || null);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // ESTADÍSTICAS
  // ==========================================

  const getPromediosPorGrupo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/acreditacion/estadisticas/promedios-grupo');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEvolucionCalificaciones = useCallback(async (grupo, periodos = 6) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/acreditacion/estadisticas/evolucion', { grupo, periodos });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getResumenAcreditacion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/acreditacion/resumen');
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
    evaluaciones,
    dashboard,
    loading,
    error,
    // Estándares
    fetchEstandares,
    getEstandarById,
    createEstandar,
    updateEstandar,
    fetchEstandaresPorGrupo,
    // Grupos
    getGruposEstandares,
    // Evaluaciones
    fetchEvaluaciones,
    getEvaluacionById,
    registrarEvaluacion,
    updateEvaluacion,
    // Autoevaluación
    getAutoevaluacionPorGrupo,
    getAutoevaluacionCompleta,
    // Niveles
    getNivelesCalificacion,
    // Brechas
    getBrechasYOportunidades,
    // Reportes
    getReporteConsolidado,
    // Dashboard
    fetchDashboard,
    // Estadísticas
    getPromediosPorGrupo,
    getEvolucionCalificaciones,
    getResumenAcreditacion,
  };
};
