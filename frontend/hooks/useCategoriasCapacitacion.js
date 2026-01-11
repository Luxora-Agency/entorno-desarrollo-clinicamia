import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCategoriasCapacitacion() {
  const [categorias, setCategorias] = useState([]);
  const [currentCategoria, setCurrentCategoria] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadCategorias = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/capacitaciones/categorias', params);
      setCategorias(response.data?.categorias || []);
      return response.data;
    } catch (error) {
      console.error('Error loading categorias:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar las categorías.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getCategoria = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/capacitaciones/categorias/${id}`);
      setCurrentCategoria(response.data?.categoria || response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting categoria:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la categoría.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCategoria = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/capacitaciones/categorias', data);
      toast({
        title: 'Categoría creada',
        description: 'La categoría se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadCategorias();
      return response.data;
    } catch (error) {
      console.error('Error creating categoria:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la categoría.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadCategorias, toast]);

  const updateCategoria = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/capacitaciones/categorias/${id}`, data);
      toast({
        title: 'Categoría actualizada',
        description: 'La categoría se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadCategorias();
      return response.data;
    } catch (error) {
      console.error('Error updating categoria:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la categoría.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadCategorias, toast]);

  const deleteCategoria = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/capacitaciones/categorias/${id}`);
      toast({
        title: 'Categoría eliminada',
        description: 'La categoría se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadCategorias();
      return true;
    } catch (error) {
      console.error('Error deleting categoria:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la categoría.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadCategorias, toast]);

  const reorderCategorias = useCallback(async (orderedIds) => {
    try {
      await apiPost('/calidad2/capacitaciones/categorias/reorder', { orderedIds });
      toast({
        title: 'Orden actualizado',
        description: 'El orden de las categorías se ha actualizado.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadCategorias();
      return true;
    } catch (error) {
      console.error('Error reordering categorias:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el orden.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadCategorias, toast]);

  return {
    categorias,
    currentCategoria,
    loading,
    loadCategorias,
    getCategoria,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    reorderCategorias,
  };
}
