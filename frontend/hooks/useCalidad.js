/**
 * Hook principal para el módulo de Calidad IPS
 * Proporciona acceso a dashboards y estadísticas generales
 */
import { useState, useCallback } from 'react';
import { apiGet } from '@/services/api';

export const useCalidad = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard ejecutivo de calidad (consolidado)
  const fetchDashboardCalidad = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Llamadas paralelas a diferentes dashboards
      const [
        habilitacion,
        pamec,
        seguridad,
        indicadores,
        pqrs,
        planesAccion
      ] = await Promise.all([
        apiGet('/habilitacion/dashboard').catch(() => ({ data: null })),
        apiGet('/pamec/dashboard').catch(() => ({ data: null })),
        apiGet('/seguridad-paciente/dashboard').catch(() => ({ data: null })),
        apiGet('/indicadores-sic/dashboard').catch(() => ({ data: null })),
        apiGet('/pqrs/dashboard').catch(() => ({ data: null })),
        apiGet('/planes-accion/dashboard/resumen').catch(() => ({ data: null })),
      ]);

      const dashboardConsolidado = {
        habilitacion: habilitacion.data?.dashboard || null,
        pamec: pamec.data?.dashboard || null,
        seguridad: seguridad.data?.dashboard || null,
        indicadores: indicadores.data?.dashboard || null,
        pqrs: pqrs.data?.dashboard || null,
        planesAccion: planesAccion.data?.dashboard || null,
        fechaActualizacion: new Date().toISOString(),
      };

      setDashboard(dashboardConsolidado);
      return { success: true, data: dashboardConsolidado };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener alertas de calidad
  const fetchAlertasCalidad = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        planesVencidos,
        planesPorVencer,
        pqrsPendientes,
        eventosNoAnalizados
      ] = await Promise.all([
        apiGet('/planes-accion/alertas/vencidos').catch(() => ({ data: { planes: [] } })),
        apiGet('/planes-accion/alertas/por-vencer', { dias: 7 }).catch(() => ({ data: { planes: [] } })),
        apiGet('/pqrs', { estado: 'Radicada', limit: 50 }).catch(() => ({ data: [] })),
        apiGet('/eventos-adversos', { estado: 'Reportado', limit: 50 }).catch(() => ({ data: [] })),
      ]);

      const alertas = {
        planesVencidos: planesVencidos.data?.planes || [],
        planesPorVencer: planesPorVencer.data?.planes || [],
        pqrsPendientes: pqrsPendientes.data || [],
        eventosNoAnalizados: eventosNoAnalizados.data || [],
      };

      return { success: true, data: alertas };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Exportar reporte consolidado
  const exportarReporteConsolidado = useCallback(async (formato = 'excel') => {
    try {
      setLoading(true);
      setError(null);
      // Esta función requiere implementación backend específica
      return { success: true, message: 'Reporte en preparación' };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dashboard,
    loading,
    error,
    fetchDashboardCalidad,
    fetchAlertasCalidad,
    exportarReporteConsolidado,
  };
};
