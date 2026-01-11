import { useState, useCallback } from 'react';
import { apiGet } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para Dashboard de Historia Clínica - Calidad
 *
 * Consolida datos de todos los submódulos:
 * - Documentos Normativos
 * - Certificaciones
 * - Consentimientos Informados
 * - Auditorías
 * - Indicadores de Calidad
 */
export function useCalidad2DashboardHC() {
  // Estado para resumen general
  const [resumen, setResumen] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  // Estado para tendencias
  const [tendenciasIndicadores, setTendenciasIndicadores] = useState([]);
  const [loadingTendencias, setLoadingTendencias] = useState(false);

  // Estado para timeline de auditorías
  const [timelineAuditorias, setTimelineAuditorias] = useState(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // Estado para distribución de consentimientos
  const [distribucionConsentimientos, setDistribucionConsentimientos] = useState(null);
  const [loadingDistribucion, setLoadingDistribucion] = useState(false);

  // Estado para top hallazgos
  const [topHallazgos, setTopHallazgos] = useState([]);
  const [loadingTopHallazgos, setLoadingTopHallazgos] = useState(false);

  /**
   * Cargar resumen general del dashboard
   * Incluye stats de todos los submódulos
   */
  const loadResumen = useCallback(async (filters = {}) => {
    setLoadingResumen(true);
    try {
      const data = await apiGet('/calidad2/historia-clinica/dashboard/resumen', filters);

      if (data.success && data.data) {
        setResumen(data.data);
        return data.data;
      }

      setResumen(null);
      return null;
    } catch (error) {
      console.error('Error cargando resumen:', error);
      toast.error('Error al cargar resumen del dashboard');
      setResumen(null);
      return null;
    } finally {
      setLoadingResumen(false);
    }
  }, []);

  /**
   * Cargar tendencias de indicadores
   * Para gráficas de evolución temporal
   */
  const loadTendenciasIndicadores = useCallback(async (filters = {}) => {
    setLoadingTendencias(true);
    try {
      const data = await apiGet(
        '/calidad2/historia-clinica/dashboard/tendencias-indicadores',
        filters
      );

      if (data.success && data.data) {
        setTendenciasIndicadores(data.data);
        return data.data;
      }

      setTendenciasIndicadores([]);
      return [];
    } catch (error) {
      console.error('Error cargando tendencias:', error);
      toast.error('Error al cargar tendencias de indicadores');
      setTendenciasIndicadores([]);
      return [];
    } finally {
      setLoadingTendencias(false);
    }
  }, []);

  /**
   * Cargar timeline de auditorías
   * Agrupa auditorías y hallazgos por mes
   */
  const loadTimelineAuditorias = useCallback(async (filters = {}) => {
    setLoadingTimeline(true);
    try {
      const data = await apiGet(
        '/calidad2/historia-clinica/dashboard/timeline-auditorias',
        filters
      );

      if (data.success && data.data) {
        setTimelineAuditorias(data.data);
        return data.data;
      }

      setTimelineAuditorias(null);
      return null;
    } catch (error) {
      console.error('Error cargando timeline:', error);
      toast.error('Error al cargar timeline de auditorías');
      setTimelineAuditorias(null);
      return null;
    } finally {
      setLoadingTimeline(false);
    }
  }, []);

  /**
   * Cargar distribución de consentimientos por servicio
   */
  const loadDistribucionConsentimientos = useCallback(async (filters = {}) => {
    setLoadingDistribucion(true);
    try {
      const data = await apiGet(
        '/calidad2/historia-clinica/dashboard/distribucion-consentimientos',
        filters
      );

      if (data.success && data.data) {
        setDistribucionConsentimientos(data.data);
        return data.data;
      }

      setDistribucionConsentimientos(null);
      return null;
    } catch (error) {
      console.error('Error cargando distribución:', error);
      toast.error('Error al cargar distribución de consentimientos');
      setDistribucionConsentimientos(null);
      return null;
    } finally {
      setLoadingDistribucion(false);
    }
  }, []);

  /**
   * Cargar top hallazgos recurrentes
   * Hallazgos más frecuentes por criterio
   */
  const loadTopHallazgos = useCallback(async (filters = {}) => {
    setLoadingTopHallazgos(true);
    try {
      const data = await apiGet(
        '/calidad2/historia-clinica/dashboard/top-hallazgos',
        filters
      );

      if (data.success && data.data) {
        setTopHallazgos(data.data);
        return data.data;
      }

      setTopHallazgos([]);
      return [];
    } catch (error) {
      console.error('Error cargando top hallazgos:', error);
      toast.error('Error al cargar top hallazgos');
      setTopHallazgos([]);
      return [];
    } finally {
      setLoadingTopHallazgos(false);
    }
  }, []);

  /**
   * Cargar todos los datos del dashboard en paralelo
   */
  const loadDashboardCompleto = useCallback(async (filters = {}) => {
    const results = await Promise.allSettled([
      loadResumen(filters),
      loadTendenciasIndicadores(filters),
      loadTimelineAuditorias(filters),
      loadDistribucionConsentimientos(filters),
      loadTopHallazgos(filters),
    ]);

    const errors = results.filter((r) => r.status === 'rejected');
    if (errors.length > 0) {
      console.error('Errores al cargar dashboard:', errors);
    }

    return results.map((r) => (r.status === 'fulfilled' ? r.value : null));
  }, [
    loadResumen,
    loadTendenciasIndicadores,
    loadTimelineAuditorias,
    loadDistribucionConsentimientos,
    loadTopHallazgos,
  ]);

  return {
    // Estado de resumen
    resumen,
    loadingResumen,

    // Estado de tendencias
    tendenciasIndicadores,
    loadingTendencias,

    // Estado de timeline
    timelineAuditorias,
    loadingTimeline,

    // Estado de distribución
    distribucionConsentimientos,
    loadingDistribucion,

    // Estado de top hallazgos
    topHallazgos,
    loadingTopHallazgos,

    // Métodos
    loadResumen,
    loadTendenciasIndicadores,
    loadTimelineAuditorias,
    loadDistribucionConsentimientos,
    loadTopHallazgos,
    loadDashboardCompleto,
  };
}
