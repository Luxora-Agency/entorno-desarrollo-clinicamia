import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/services/api';
import { toast } from 'sonner';

export function useMantenimientosEquipos() {
  const [equipos, setEquipos] = useState([]);
  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);

  /**
   * Obtener todos los equipos con filtros
   */
  const loadEquipos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const data = await apiGet('/calidad2/infraestructura/mantenimientos/equipos', filters);
      setEquipos(data.data?.equipos || []);
      return data;
    } catch (error) {
      toast.error('Error al cargar equipos');
      setEquipos([]);
      return { equipos: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener equipos por tipo
   */
  const loadEquiposPorTipo = useCallback(async (tipo) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/mantenimientos/equipos/tipo/${tipo}`);
      setEquipos(data.data || []);
      return data;
    } catch (error) {
      toast.error(`Error al cargar equipos de tipo ${tipo}`);
      setEquipos([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener equipo por ID
   */
  const loadEquipo = useCallback(async (id) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/mantenimientos/equipos/${id}`);
      setEquipo(data.data);
      return data;
    } catch (error) {
      toast.error('Error al cargar equipo');
      setEquipo(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear equipo
   */
  const createEquipo = useCallback(async (equipoData) => {
    try {
      setLoading(true);
      const data = await apiPost('/calidad2/infraestructura/mantenimientos/equipos', equipoData);
      toast.success('Equipo creado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al crear equipo');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar equipo
   */
  const updateEquipo = useCallback(async (id, equipoData) => {
    try {
      setLoading(true);
      const data = await apiPut(`/calidad2/infraestructura/mantenimientos/equipos/${id}`, equipoData);
      toast.success('Equipo actualizado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al actualizar equipo');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cambiar estado del equipo
   */
  const cambiarEstado = useCallback(async (id, estado, observaciones = null) => {
    try {
      setLoading(true);
      const data = await apiPatch(`/calidad2/infraestructura/mantenimientos/equipos/${id}/estado`, {
        estado,
        observaciones,
      });
      toast.success(`Estado cambiado a ${estado}`);
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al cambiar estado');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar equipo
   */
  const deleteEquipo = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/mantenimientos/equipos/${id}`);
      toast.success('Equipo eliminado exitosamente');
      return true;
    } catch (error) {
      toast.error(error.message || 'Error al eliminar equipo');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas de equipos
   */
  const loadEstadisticas = useCallback(async () => {
    try {
      const data = await apiGet('/calidad2/infraestructura/mantenimientos/equipos/stats');
      setEstadisticas(data.data);
      return data;
    } catch (error) {
      toast.error('Error al cargar estadísticas');
      setEstadisticas(null);
      return null;
    }
  }, []);

  return {
    equipos,
    equipo,
    loading,
    estadisticas,
    loadEquipos,
    loadEquiposPorTipo,
    loadEquipo,
    createEquipo,
    updateEquipo,
    cambiarEstado,
    deleteEquipo,
    loadEstadisticas,
  };
}
