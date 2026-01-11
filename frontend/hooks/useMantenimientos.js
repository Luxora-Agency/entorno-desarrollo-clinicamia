import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useMantenimientos() {
  const [mantenimientos, setMantenimientos] = useState([]);
  const [mantenimiento, setMantenimiento] = useState(null);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [timeline, setTimeline] = useState([]);

  /**
   * Obtener todos los mantenimientos con filtros
   */
  const loadMantenimientos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const data = await apiGet('/calidad2/infraestructura/mantenimientos/mantenimientos', filters);
      setMantenimientos(data.mantenimientos || []);
      return data;
    } catch (error) {
      toast.error('Error al cargar mantenimientos');
      return { mantenimientos: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener mantenimiento por ID
   */
  const loadMantenimiento = useCallback(async (id) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/mantenimientos/mantenimientos/${id}`);
      setMantenimiento(data);
      return data;
    } catch (error) {
      toast.error('Error al cargar mantenimiento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear mantenimiento
   */
  const createMantenimiento = useCallback(async (mantenimientoData) => {
    try {
      setLoading(true);
      const data = await apiPost('/calidad2/infraestructura/mantenimientos/mantenimientos', mantenimientoData);
      toast.success('Mantenimiento creado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al crear mantenimiento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar mantenimiento
   */
  const updateMantenimiento = useCallback(async (id, mantenimientoData) => {
    try {
      setLoading(true);
      const data = await apiPut(`/calidad2/infraestructura/mantenimientos/mantenimientos/${id}`, mantenimientoData);
      toast.success('Mantenimiento actualizado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al actualizar mantenimiento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Completar mantenimiento
   */
  const completarMantenimiento = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const result = await apiPost(`/calidad2/infraestructura/mantenimientos/mantenimientos/${id}/completar`, data);
      toast.success('Mantenimiento completado exitosamente');
      return result;
    } catch (error) {
      toast.error(error.message || 'Error al completar mantenimiento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancelar mantenimiento
   */
  const cancelarMantenimiento = useCallback(async (id, motivo) => {
    try {
      setLoading(true);
      const result = await apiPost(`/calidad2/infraestructura/mantenimientos/mantenimientos/${id}/cancelar`, { motivo });
      toast.success('Mantenimiento cancelado');
      return result;
    } catch (error) {
      toast.error(error.message || 'Error al cancelar mantenimiento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar mantenimiento
   */
  const deleteMantenimiento = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/mantenimientos/mantenimientos/${id}`);
      toast.success('Mantenimiento eliminado exitosamente');
      return true;
    } catch (error) {
      toast.error(error.message || 'Error al eliminar mantenimiento');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas de mantenimientos
   */
  const loadEstadisticas = useCallback(async (filters = {}) => {
    try {
      const data = await apiGet('/calidad2/infraestructura/mantenimientos/mantenimientos/stats', filters);
      setEstadisticas(data);
      return data;
    } catch (error) {
      toast.error('Error al cargar estadísticas');
      return null;
    }
  }, []);

  /**
   * Obtener próximos mantenimientos
   */
  const loadProximos = useCallback(async (limit = 10) => {
    try {
      const data = await apiGet('/calidad2/infraestructura/mantenimientos/mantenimientos/proximos', { limit });
      return data;
    } catch (error) {
      toast.error('Error al cargar próximos mantenimientos');
      return [];
    }
  }, []);

  /**
   * Obtener timeline de mantenimientos de un equipo
   */
  const loadTimelineEquipo = useCallback(async (equipoId) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/mantenimientos/mantenimientos/timeline/${equipoId}`);
      setTimeline(data || []);
      return data;
    } catch (error) {
      toast.error('Error al cargar timeline del equipo');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    mantenimientos,
    mantenimiento,
    loading,
    estadisticas,
    timeline,
    loadMantenimientos,
    loadMantenimiento,
    createMantenimiento,
    updateMantenimiento,
    completarMantenimiento,
    cancelarMantenimiento,
    deleteMantenimiento,
    loadEstadisticas,
    loadProximos,
    loadTimelineEquipo,
  };
}
