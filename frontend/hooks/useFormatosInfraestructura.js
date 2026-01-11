import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useFormatosInfraestructura() {
  const [formatos, setFormatos] = useState([]);
  const [formato, setFormato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);

  /**
   * Obtener todos los formatos con filtros
   */
  const loadFormatos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const data = await apiGet('/calidad2/infraestructura/formatos', filters);
      setFormatos(data.data?.formatos || data.data || []);
      return data;
    } catch (error) {
      toast.error('Error al cargar formatos');
      setFormatos([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener formatos por categoría
   */
  const loadFormatosPorCategoria = useCallback(async (categoria) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/formatos/categoria/${categoria}`);
      setFormatos(data.data || []);
      return data;
    } catch (error) {
      toast.error(`Error al cargar formatos de categoría ${categoria}`);
      setFormatos([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener formato por ID
   */
  const loadFormato = useCallback(async (id) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/formatos/${id}`);
      setFormato(data.data);
      return data;
    } catch (error) {
      toast.error('Error al cargar formato');
      setFormato(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener formato por código
   */
  const loadFormatoByCodigo = useCallback(async (codigo) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/formatos/codigo/${codigo}`);
      setFormato(data.data);
      return data;
    } catch (error) {
      toast.error('Error al cargar formato');
      setFormato(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear formato
   */
  const createFormato = useCallback(async (formatoData) => {
    try {
      setLoading(true);
      const data = await apiPost('/calidad2/infraestructura/formatos', formatoData);
      toast.success('Formato creado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al crear formato');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar formato
   */
  const updateFormato = useCallback(async (id, formatoData) => {
    try {
      setLoading(true);
      const data = await apiPut(`/calidad2/infraestructura/formatos/${id}`, formatoData);
      toast.success('Formato actualizado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al actualizar formato');
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
      toast.error(error.message || 'Error al eliminar formato');
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
      const data = await apiPost(`/calidad2/infraestructura/formatos/${id}/duplicar`, {
        codigo: nuevoCodigo,
      });
      toast.success('Formato duplicado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al duplicar formato');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas
   */
  const loadEstadisticas = useCallback(async () => {
    try {
      const data = await apiGet('/calidad2/infraestructura/formatos/estadisticas');
      setEstadisticas(data.data);
      return data;
    } catch (error) {
      toast.error('Error al cargar estadísticas');
      setEstadisticas(null);
      return null;
    }
  }, []);

  /**
   * Obtener categorías disponibles
   */
  const loadCategorias = useCallback(async () => {
    try {
      const data = await apiGet('/calidad2/infraestructura/formatos/categorias');
      return data;
    } catch (error) {
      toast.error('Error al cargar categorías');
      return [];
    }
  }, []);

  /**
   * Descargar plantilla
   */
  const descargarPlantilla = useCallback(async (formato) => {
    try {
      if (!formato.plantillaUrl) {
        toast.error('Este formato no tiene plantilla disponible');
        return;
      }
      window.open(formato.plantillaUrl, '_blank');
      toast.success('Descargando plantilla...');
    } catch (error) {
      toast.error('Error al descargar plantilla');
    }
  }, []);

  return {
    formatos,
    formato,
    loading,
    estadisticas,
    loadFormatos,
    loadFormatosPorCategoria,
    loadFormato,
    loadFormatoByCodigo,
    createFormato,
    updateFormato,
    deleteFormato,
    duplicarFormato,
    loadEstadisticas,
    loadCategorias,
    descargarPlantilla,
  };
}
