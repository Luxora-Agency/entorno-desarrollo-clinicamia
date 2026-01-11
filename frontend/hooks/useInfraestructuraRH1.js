import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useInfraestructuraRH1() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Cargar registros de un mes completo (31 días)
   */
  const loadMes = useCallback(async (mes, anio) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/rh1/mes/${mes}/anio/${anio}`);
      setRegistros(response.data || []);
      return response.data;
    } catch (error) {
      console.error('Error al cargar registros RH1:', error);
      toast.error(error.response?.data?.message || 'Error al cargar registros');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Guardar un registro diario (upsert)
   */
  const saveRegistro = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/infraestructura/rh1', data);
      toast.success('Registro guardado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al guardar registro:', error);
      toast.error(error.response?.data?.message || 'Error al guardar registro');
      return null;
    }
  }, []);

  /**
   * Guardar múltiples registros (batch)
   */
  const saveBatch = useCallback(async (registros) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/infraestructura/rh1/batch', { registros });
      toast.success(`${registros.length} registros guardados exitosamente`);
      return response.data;
    } catch (error) {
      console.error('Error al guardar registros:', error);
      toast.error(error.response?.data?.message || 'Error al guardar registros');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener totales del mes
   */
  const getTotalesMes = useCallback(async (mes, anio) => {
    try {
      const response = await apiGet(`/calidad2/infraestructura/rh1/totales/${mes}/${anio}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener totales:', error);
      toast.error(error.response?.data?.message || 'Error al obtener totales');
      return null;
    }
  }, []);

  /**
   * Eliminar registro
   */
  const deleteRegistro = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/infraestructura/rh1/${id}`);
      toast.success('Registro eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar registro:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar registro');
      return false;
    }
  }, []);

  /**
   * Obtener estadísticas generales
   */
  const getEstadisticas = useCallback(async (anio) => {
    try {
      const url = anio
        ? `/calidad2/infraestructura/rh1/estadisticas?anio=${anio}`
        : '/calidad2/infraestructura/rh1/estadisticas';

      const response = await apiGet(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      toast.error(error.response?.data?.message || 'Error al obtener estadísticas');
      return null;
    }
  }, []);

  /**
   * Obtener años disponibles
   */
  const getAniosDisponibles = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/infraestructura/rh1/anios-disponibles');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener años disponibles:', error);
      return [];
    }
  }, []);

  /**
   * Validar consistencia de totales
   */
  const validarConsistencia = useCallback(async (mes, anio) => {
    try {
      const response = await apiGet(`/calidad2/infraestructura/rh1/validar-consistencia/${mes}/${anio}`);
      return response.data;
    } catch (error) {
      console.error('Error al validar consistencia:', error);
      toast.error(error.response?.data?.message || 'Error al validar consistencia');
      return null;
    }
  }, []);

  return {
    registros,
    loading,
    loadMes,
    saveRegistro,
    saveBatch,
    getTotalesMes,
    deleteRegistro,
    getEstadisticas,
    getAniosDisponibles,
    validarConsistencia,
  };
}
