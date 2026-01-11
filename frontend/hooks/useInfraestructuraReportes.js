import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useInfraestructuraReportes() {
  const [reportes, setReportes] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generando, setGenerando] = useState(false);

  /**
   * Cargar todos los reportes con filtros
   */
  const loadReportes = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.periodo) params.append('periodo', filters.periodo);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiGet(`/calidad2/infraestructura/reportes?${params.toString()}`);
      setReportes(response.data.reportes || []);
      return response.data;
    } catch (error) {
      console.error('Error al cargar reportes:', error);
      toast.error(error.response?.data?.message || 'Error al cargar reportes');
      return { reportes: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener tipos de reportes disponibles
   */
  const getTipos = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/infraestructura/reportes/tipos');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener tipos:', error);
      return [];
    }
  }, []);

  /**
   * Obtener estadísticas
   */
  const loadEstadisticas = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/infraestructura/reportes/estadisticas');
      setEstadisticas(response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }, []);

  /**
   * Obtener reporte por ID
   */
  const getById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/reportes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte:', error);
      toast.error(error.response?.data?.message || 'Error al obtener reporte');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generar reporte mensual RH1
   */
  const generarReporteMensualRH1 = useCallback(async (mes, anio) => {
    try {
      setGenerando(true);
      const response = await apiPost('/calidad2/infraestructura/reportes/generar/rh1-mensual', {
        mes,
        anio,
      });
      toast.success('Reporte RH1 generado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al generar reporte RH1:', error);
      toast.error(error.response?.data?.message || 'Error al generar reporte');
      return null;
    } finally {
      setGenerando(false);
    }
  }, []);

  /**
   * Generar reporte semestral de indicadores
   */
  const generarReporteSemestralIndicadores = useCallback(async (semestre, anio) => {
    try {
      setGenerando(true);
      const response = await apiPost(
        '/calidad2/infraestructura/reportes/generar/indicadores-semestral',
        {
          semestre,
          anio,
        }
      );
      toast.success('Reporte de indicadores generado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al generar reporte de indicadores:', error);
      toast.error(error.response?.data?.message || 'Error al generar reporte');
      return null;
    } finally {
      setGenerando(false);
    }
  }, []);

  /**
   * Generar reporte personalizado
   */
  const generarReportePersonalizado = useCallback(async (config) => {
    try {
      setGenerando(true);
      const response = await apiPost(
        '/calidad2/infraestructura/reportes/generar/personalizado',
        config
      );
      toast.success('Reporte personalizado generado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al generar reporte personalizado:', error);
      toast.error(error.response?.data?.message || 'Error al generar reporte');
      return null;
    } finally {
      setGenerando(false);
    }
  }, []);

  /**
   * Eliminar reporte
   */
  const deleteReporte = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/reportes/${id}`);
      toast.success('Reporte eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar reporte');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Descargar reporte
   */
  const descargarReporte = useCallback((reporte) => {
    if (!reporte.archivoUrl) {
      toast.error('El reporte no tiene archivo disponible');
      return;
    }

    // Construir URL completa
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const url = `${baseUrl}${reporte.archivoUrl}`;

    // Abrir en nueva pestaña para descarga
    window.open(url, '_blank');
    toast.success('Descarga iniciada');
  }, []);

  return {
    reportes,
    estadisticas,
    loading,
    generando,
    loadReportes,
    getTipos,
    loadEstadisticas,
    getById,
    generarReporteMensualRH1,
    generarReporteSemestralIndicadores,
    generarReportePersonalizado,
    deleteReporte,
    descargarReporte,
  };
}
