import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useInfraestructuraFormatos() {
  const [formatos, setFormatos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Cargar todos los formatos con filtros
   */
  const loadFormatos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.categoria) params.append('categoria', filters.categoria);
      if (filters.search) params.append('search', filters.search);

      const response = await apiGet(`/calidad2/infraestructura/formatos?${params.toString()}`);
      setFormatos(response.data.formatos || []);
      return response.data;
    } catch (error) {
      console.error('Error al cargar formatos:', error);
      toast.error(error.response?.data?.message || 'Error al cargar formatos');
      return { formatos: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar formatos por categoría
   */
  const loadByCategoria = useCallback(async (categoria) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/formatos/categoria/${categoria}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al cargar formatos:', error);
      toast.error(error.response?.data?.message || 'Error al cargar formatos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener categorías disponibles
   */
  const getCategorias = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/infraestructura/formatos/categorias');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      return [];
    }
  }, []);

  /**
   * Obtener estadísticas
   */
  const loadEstadisticas = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/infraestructura/formatos/estadisticas');
      setEstadisticas(response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }, []);

  /**
   * Obtener formato por ID
   */
  const getById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/formatos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener formato:', error);
      toast.error(error.response?.data?.message || 'Error al obtener formato');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear formato
   */
  const createFormato = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/infraestructura/formatos', data);
      toast.success('Formato creado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al crear formato:', error);
      toast.error(error.response?.data?.message || 'Error al crear formato');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar formato
   */
  const updateFormato = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/infraestructura/formatos/${id}`, data);
      toast.success('Formato actualizado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al actualizar formato:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar formato');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar formato
   */
  const deleteFormato = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/formatos/${id}`);
      toast.success('Formato eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar formato:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar formato');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Duplicar formato
   */
  const duplicarFormato = useCallback(async (id, nuevoCodigo) => {
    try {
      setLoading(true);
      const response = await apiPost(`/calidad2/infraestructura/formatos/${id}/duplicar`, {
        codigo: nuevoCodigo,
      });
      toast.success('Formato duplicado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al duplicar formato:', error);
      toast.error(error.response?.data?.message || 'Error al duplicar formato');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    formatos,
    estadisticas,
    loading,
    loadFormatos,
    loadByCategoria,
    getCategorias,
    loadEstadisticas,
    getById,
    createFormato,
    updateFormato,
    deleteFormato,
    duplicarFormato,
  };
}
