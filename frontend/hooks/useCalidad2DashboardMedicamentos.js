import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet } from '@/services/api';

/**
 * Hook for Medicamentos Dashboard
 * Provides consolidated statistics and visualizations
 */
export function useCalidad2DashboardMedicamentos() {
  const [resumenGeneral, setResumenGeneral] = useState(null);
  const [inventarioStats, setInventarioStats] = useState(null);
  const [farmacoStats, setFarmacoStats] = useState(null);
  const [tecnoStats, setTecnoStats] = useState(null);
  const [alertasStats, setAlertasStats] = useState(null);
  const [temperaturaStats, setTemperaturaStats] = useState(null);
  const [reportesMensuales, setReportesMensuales] = useState(null);
  const [graficasTemperatura, setGraficasTemperatura] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Load comprehensive general summary
   */
  const loadResumenGeneral = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/dashboard/resumen-general');
      setResumenGeneral(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading resumen general:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el resumen general.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Load detailed inventory statistics
   */
  const loadInventarioStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/dashboard/inventario');
      setInventarioStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading inventario stats:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas de inventario.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Load farmacovigilancia statistics
   */
  const loadFarmacoStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/dashboard/farmacovigilancia');
      setFarmacoStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading farmacovigilancia stats:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas de farmacovigilancia.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Load tecnovigilancia statistics
   */
  const loadTecnoStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/dashboard/tecnovigilancia');
      setTecnoStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading tecnovigilancia stats:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas de tecnovigilancia.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Load alerts statistics
   */
  const loadAlertasStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/dashboard/alertas');
      setAlertasStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading alertas stats:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas de alertas.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Load temperature/humidity statistics
   */
  const loadTemperaturaStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/dashboard/temperatura');
      setTemperaturaStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading temperatura stats:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas de temperatura.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Load monthly reports trends
   */
  const loadReportesMensuales = useCallback(async (anio = new Date().getFullYear()) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/medicamentos/dashboard/reportes-mensuales/${anio}`);
      setReportesMensuales(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading reportes mensuales:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes mensuales.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Load temperature/humidity graphs for specific area
   */
  const loadGraficasTemperatura = useCallback(async (area, periodo = 'mes') => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/medicamentos/dashboard/graficas-temperatura/${area}`, { periodo });
      setGraficasTemperatura(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading graficas temperatura:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las gráficas de temperatura.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    // State
    resumenGeneral,
    inventarioStats,
    farmacoStats,
    tecnoStats,
    alertasStats,
    temperaturaStats,
    reportesMensuales,
    graficasTemperatura,
    loading,

    // Methods
    loadResumenGeneral,
    loadInventarioStats,
    loadFarmacoStats,
    loadTecnoStats,
    loadAlertasStats,
    loadTemperaturaStats,
    loadReportesMensuales,
    loadGraficasTemperatura,
  };
}
