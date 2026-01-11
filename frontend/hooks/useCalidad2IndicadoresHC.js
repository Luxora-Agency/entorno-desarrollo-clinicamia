import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para gestión de Indicadores de Calidad de Historia Clínica
 *
 * Gestiona:
 * - CRUD de indicadores de calidad HC
 * - Mediciones periódicas
 * - Dashboard con tendencias y análisis
 * - Cumplimiento de metas
 */
export function useCalidad2IndicadoresHC() {
  // Estado para indicadores
  const [indicadores, setIndicadores] = useState([]);
  const [indicador, setIndicador] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Estado para mediciones
  const [mediciones, setMediciones] = useState([]);
  const [loadingMediciones, setLoadingMediciones] = useState(false);
  const [paginationMediciones, setPaginationMediciones] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  // Estado para dashboard
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // ==========================================
  // INDICADORES
  // ==========================================

  /**
   * Cargar todos los indicadores con filtros
   */
  const loadIndicadores = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const data = await apiGet('/calidad2/historia-clinica/indicadores', filters);

      if (data.success) {
        setIndicadores(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }

      return data;
    } catch (error) {
      console.error('Error cargando indicadores:', error);
      toast.error('Error al cargar indicadores');
      setIndicadores([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar un indicador por ID
   */
  const loadIndicador = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await apiGet(`/calidad2/historia-clinica/indicadores/${id}`);

      if (data.success && data.data) {
        setIndicador(data.data);
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Error cargando indicador:', error);
      toast.error('Error al cargar indicador');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear nuevo indicador
   */
  const createIndicador = useCallback(async (indicadorData) => {
    setLoading(true);
    try {
      const data = await apiPost('/calidad2/historia-clinica/indicadores', indicadorData);

      if (data.success) {
        toast.success(data.message || 'Indicador creado exitosamente');
        return true;
      }

      toast.error(data.message || 'Error al crear indicador');
      return false;
    } catch (error) {
      console.error('Error creando indicador:', error);
      toast.error('Error al crear indicador');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar indicador existente
   */
  const updateIndicador = useCallback(async (id, indicadorData) => {
    setLoading(true);
    try {
      const data = await apiPut(`/calidad2/historia-clinica/indicadores/${id}`, indicadorData);

      if (data.success) {
        toast.success(data.message || 'Indicador actualizado exitosamente');
        return true;
      }

      toast.error(data.message || 'Error al actualizar indicador');
      return false;
    } catch (error) {
      console.error('Error actualizando indicador:', error);
      toast.error('Error al actualizar indicador');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar indicador (soft delete)
   */
  const deleteIndicador = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await apiDelete(`/calidad2/historia-clinica/indicadores/${id}`);

      if (data.success) {
        toast.success(data.message || 'Indicador eliminado exitosamente');
        return true;
      }

      toast.error(data.message || 'Error al eliminar indicador');
      return false;
    } catch (error) {
      console.error('Error eliminando indicador:', error);
      toast.error('Error al eliminar indicador');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // MEDICIONES
  // ==========================================

  /**
   * Crear medición de indicador
   */
  const createMedicion = useCallback(async (indicadorId, medicionData) => {
    setLoadingMediciones(true);
    try {
      const data = await apiPost(
        `/calidad2/historia-clinica/indicadores/${indicadorId}/mediciones`,
        medicionData
      );

      if (data.success) {
        toast.success(data.message || 'Medición registrada exitosamente');
        return true;
      }

      toast.error(data.message || 'Error al registrar medición');
      return false;
    } catch (error) {
      console.error('Error creando medición:', error);
      toast.error(error.message || 'Error al registrar medición');
      return false;
    } finally {
      setLoadingMediciones(false);
    }
  }, []);

  /**
   * Cargar mediciones de un indicador
   */
  const loadMediciones = useCallback(async (indicadorId, filters = {}) => {
    setLoadingMediciones(true);
    try {
      const data = await apiGet(
        `/calidad2/historia-clinica/indicadores/${indicadorId}/mediciones`,
        filters
      );

      if (data.success) {
        setMediciones(data.data || []);
        if (data.pagination) {
          setPaginationMediciones(data.pagination);
        }
        return data.data;
      }

      setMediciones([]);
      return [];
    } catch (error) {
      console.error('Error cargando mediciones:', error);
      toast.error('Error al cargar mediciones');
      setMediciones([]);
      return [];
    } finally {
      setLoadingMediciones(false);
    }
  }, []);

  /**
   * Obtener dashboard de indicadores con tendencias
   */
  const loadDashboard = useCallback(async (filters = {}) => {
    setLoadingDashboard(true);
    try {
      const data = await apiGet('/calidad2/historia-clinica/indicadores/dashboard', filters);

      if (data.success && data.data) {
        setDashboard(data.data);
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error al cargar dashboard de indicadores');
      return null;
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  return {
    // Estado de indicadores
    indicadores,
    indicador,
    loading,
    pagination,

    // Estado de mediciones
    mediciones,
    loadingMediciones,
    paginationMediciones,

    // Estado de dashboard
    dashboard,
    loadingDashboard,

    // Métodos de indicadores
    loadIndicadores,
    loadIndicador,
    createIndicador,
    updateIndicador,
    deleteIndicador,

    // Métodos de mediciones
    createMedicion,
    loadMediciones,

    // Métodos de dashboard
    loadDashboard
  };
}
