import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useInfraestructuraActas() {
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Cargar actas con filtros
   */
  const loadActas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.tipoEquipo) params.append('tipoEquipo', filters.tipoEquipo);
      if (filters.anio) params.append('anio', filters.anio);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiGet(`/calidad2/infraestructura/actas-desactivacion?${params.toString()}`);
      setActas(response.data || []);
      return response;
    } catch (error) {
      console.error('Error al cargar actas:', error);
      toast.error(error.response?.data?.message || 'Error al cargar actas');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear acta
   */
  const createActa = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/infraestructura/actas-desactivacion', data);
      toast.success('Acta creada exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al crear acta:', error);
      toast.error(error.response?.data?.message || 'Error al crear acta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar acta
   */
  const updateActa = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/infraestructura/actas-desactivacion/${id}`, data);
      toast.success('Acta actualizada exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al actualizar acta:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar acta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar acta
   */
  const deleteActa = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/actas-desactivacion/${id}`);
      toast.success('Acta eliminada exitosamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar acta:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar acta');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas por tipo de equipo
   */
  const getEstadisticasPorTipo = useCallback(async (anio) => {
    try {
      const url = anio
        ? `/calidad2/infraestructura/actas-desactivacion/estadisticas?anio=${anio}`
        : '/calidad2/infraestructura/actas-desactivacion/estadisticas';

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
      const response = await apiGet('/calidad2/infraestructura/actas-desactivacion/anios-disponibles');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener años disponibles:', error);
      return [];
    }
  }, []);

  /**
   * Obtener acta por ID
   */
  const getById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/actas-desactivacion/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener acta:', error);
      toast.error(error.response?.data?.message || 'Error al obtener acta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    actas,
    loading,
    loadActas,
    createActa,
    updateActa,
    deleteActa,
    getEstadisticasPorTipo,
    getAniosDisponibles,
    getById,
  };
}
