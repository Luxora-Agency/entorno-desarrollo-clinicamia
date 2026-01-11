import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useCronogramaMantenimiento() {
  const [cronogramas, setCronogramas] = useState([]);
  const [cronograma, setCronograma] = useState(null);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cronogramaAnual, setCronogramaAnual] = useState(null);
  const [cronogramaMensual, setCronogramaMensual] = useState([]);

  /**
   * Obtener todos los cronogramas con filtros
   */
  const loadCronogramas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const data = await apiGet('/calidad2/infraestructura/mantenimientos/cronograma', filters);
      setCronogramas(data.data?.cronogramas || []);
      return data;
    } catch (error) {
      toast.error('Error al cargar cronogramas');
      setCronogramas([]);
      return { cronogramas: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener cronograma por ID
   */
  const loadCronograma = useCallback(async (id) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/mantenimientos/cronograma/${id}`);
      setCronograma(data.data);
      return data;
    } catch (error) {
      toast.error('Error al cargar cronograma');
      setCronograma(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener cronograma anual de un equipo
   */
  const loadCronogramaAnual = useCallback(async (equipoId, anio) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/mantenimientos/cronograma/equipo/${equipoId}/anio/${anio}`);
      setCronogramaAnual(data.data);
      return data;
    } catch (error) {
      toast.error('Error al cargar cronograma anual');
      setCronogramaAnual(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener cronograma mensual (todos los equipos)
   */
  const loadCronogramaMensual = useCallback(async (mes, anio) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/mantenimientos/cronograma/mes/${mes}/anio/${anio}`);
      setCronogramaMensual(data.data || []);
      return data;
    } catch (error) {
      toast.error('Error al cargar cronograma mensual');
      setCronogramaMensual([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear entrada en cronograma
   */
  const createCronograma = useCallback(async (cronogramaData) => {
    try {
      setLoading(true);
      const data = await apiPost('/calidad2/infraestructura/mantenimientos/cronograma', cronogramaData);
      toast.success('Cronograma creado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al crear cronograma');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generar cronograma anual automático
   */
  const generarCronogramaAnual = useCallback(async (equipoId, anio, config = {}) => {
    try {
      setLoading(true);
      const data = await apiPost('/calidad2/infraestructura/mantenimientos/cronograma/generar', {
        equipoId,
        anio,
        config,
      });
      toast.success('Cronograma anual generado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al generar cronograma');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar cronograma
   */
  const updateCronograma = useCallback(async (id, cronogramaData) => {
    try {
      setLoading(true);
      const data = await apiPut(`/calidad2/infraestructura/mantenimientos/cronograma/${id}`, cronogramaData);
      toast.success('Cronograma actualizado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al actualizar cronograma');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Marcar cronograma como completado
   */
  const marcarCompletado = useCallback(async (id, mantenimientoId) => {
    try {
      setLoading(true);
      const data = await apiPost(`/calidad2/infraestructura/mantenimientos/cronograma/${id}/completar`, {
        mantenimientoId,
      });
      toast.success('Cronograma marcado como completado');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al completar cronograma');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reprogramar mantenimiento
   */
  const reprogramar = useCallback(async (id, nuevaFecha) => {
    try {
      setLoading(true);
      const data = await apiPost(`/calidad2/infraestructura/mantenimientos/cronograma/${id}/reprogramar`, {
        nuevaFecha,
      });
      toast.success('Mantenimiento reprogramado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al reprogramar');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancelar mantenimiento programado
   */
  const cancelar = useCallback(async (id, motivo) => {
    try {
      setLoading(true);
      const data = await apiPost(`/calidad2/infraestructura/mantenimientos/cronograma/${id}/cancelar`, {
        motivo,
      });
      toast.success('Mantenimiento cancelado');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al cancelar');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar cronograma
   */
  const deleteCronograma = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/mantenimientos/cronograma/${id}`);
      toast.success('Cronograma eliminado exitosamente');
      return true;
    } catch (error) {
      toast.error(error.message || 'Error al eliminar cronograma');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas del cronograma
   */
  const loadEstadisticas = useCallback(async (anio) => {
    try {
      const data = await apiGet(`/calidad2/infraestructura/mantenimientos/cronograma/stats/${anio}`);
      setEstadisticas(data.data);
      return data;
    } catch (error) {
      toast.error('Error al cargar estadísticas');
      setEstadisticas(null);
      return null;
    }
  }, []);

  return {
    cronogramas,
    cronograma,
    cronogramaAnual,
    cronogramaMensual,
    loading,
    estadisticas,
    loadCronogramas,
    loadCronograma,
    loadCronogramaAnual,
    loadCronogramaMensual,
    createCronograma,
    generarCronogramaAnual,
    updateCronograma,
    marcarCompletado,
    reprogramar,
    cancelar,
    deleteCronograma,
    loadEstadisticas,
  };
}
