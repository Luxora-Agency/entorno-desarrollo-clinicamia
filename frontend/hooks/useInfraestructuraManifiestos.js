import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useInfraestructuraManifiestos() {
  const [manifiestos, setManifiestos] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Cargar manifiestos con filtros
   */
  const loadManifiestos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.tipoResiduo) params.append('tipoResiduo', filters.tipoResiduo);
      if (filters.anio) params.append('anio', filters.anio);
      if (filters.mes) params.append('mes', filters.mes);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiGet(`/calidad2/infraestructura/manifiestos?${params.toString()}`);
      setManifiestos(response.data || []);
      return response;
    } catch (error) {
      console.error('Error al cargar manifiestos:', error);
      toast.error(error.response?.data?.message || 'Error al cargar manifiestos');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear manifiesto
   */
  const createManifiesto = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/infraestructura/manifiestos', data);
      toast.success('Manifiesto creado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al crear manifiesto:', error);
      toast.error(error.response?.data?.message || 'Error al crear manifiesto');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar manifiesto
   */
  const updateManifiesto = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/infraestructura/manifiestos/${id}`, data);
      toast.success('Manifiesto actualizado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al actualizar manifiesto:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar manifiesto');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar manifiesto
   */
  const deleteManifiesto = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/manifiestos/${id}`);
      toast.success('Manifiesto eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar manifiesto:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar manifiesto');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener totales por tipo de residuo
   */
  const getTotalesPorTipo = useCallback(async (anio, mes) => {
    try {
      const params = new URLSearchParams();
      if (anio) params.append('anio', anio);
      if (mes) params.append('mes', mes);

      const response = await apiGet(`/calidad2/infraestructura/manifiestos/totales?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener totales:', error);
      toast.error(error.response?.data?.message || 'Error al obtener totales');
      return null;
    }
  }, []);

  /**
   * Obtener manifiesto por ID
   */
  const getById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/manifiestos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener manifiesto:', error);
      toast.error(error.response?.data?.message || 'Error al obtener manifiesto');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    manifiestos,
    loading,
    loadManifiestos,
    createManifiesto,
    updateManifiesto,
    deleteManifiesto,
    getTotalesPorTipo,
    getById,
  };
}
