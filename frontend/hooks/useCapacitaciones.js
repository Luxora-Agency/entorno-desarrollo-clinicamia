import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCapacitaciones() {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [currentCapacitacion, setCurrentCapacitacion] = useState(null);
  const [cronograma, setCronograma] = useState(null);
  const [materiales, setMateriales] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    anio: new Date().getFullYear(),
    categoriaId: '',
    estado: '',
    search: '',
  });

  const loadCapacitaciones = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      };
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null) {
          delete queryParams[key];
        }
      });

      const response = await apiGet('/calidad2/capacitaciones', queryParams);
      setCapacitaciones(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading capacitaciones:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar las capacitaciones.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  const loadCronograma = useCallback(async (anio) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/capacitaciones/cronograma/${anio}`);
      setCronograma(response.data?.cronograma || response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading cronograma:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el cronograma.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getCapacitacion = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/capacitaciones/${id}`);
      setCurrentCapacitacion(response.data?.capacitacion || response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting capacitacion:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la capacitación.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createCapacitacion = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/capacitaciones', data);
      toast({
        title: 'Capacitación creada',
        description: 'La capacitación se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      return response.data?.capacitacion || response.data;
    } catch (error) {
      console.error('Error creating capacitacion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la capacitación.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateCapacitacion = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/capacitaciones/${id}`, data);
      toast({
        title: 'Capacitación actualizada',
        description: 'La capacitación se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentCapacitacion?.id === id) {
        setCurrentCapacitacion(response.data?.capacitacion || response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error updating capacitacion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la capacitación.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentCapacitacion, toast]);

  const deleteCapacitacion = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/capacitaciones/${id}`);
      toast({
        title: 'Capacitación eliminada',
        description: 'La capacitación se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      return true;
    } catch (error) {
      console.error('Error deleting capacitacion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la capacitación.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const loadMateriales = useCallback(async (capacitacionId) => {
    try {
      const response = await apiGet(`/calidad2/capacitaciones/${capacitacionId}/materiales`);
      setMateriales(response.data?.materiales || []);
      return response.data;
    } catch (error) {
      console.error('Error loading materiales:', error);
      return [];
    }
  }, []);

  const uploadMaterial = useCallback(async (capacitacionId, file, metadata = {}) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (metadata.nombre) formData.append('nombre', metadata.nombre);
      if (metadata.descripcion) formData.append('descripcion', metadata.descripcion);
      if (metadata.tipo) formData.append('tipo', metadata.tipo);

      const response = await apiPost(
        `/calidad2/capacitaciones/${capacitacionId}/materiales`,
        formData
      );

      toast({
        title: 'Material subido',
        description: 'El material se ha subido correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      await loadMateriales(capacitacionId);

      return response.data;
    } catch (error) {
      console.error('Error uploading material:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo subir el material.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [loadMateriales, toast]);

  const loadStats = useCallback(async (anio) => {
    try {
      const response = await apiGet('/calidad2/capacitaciones/stats', { anio });
      setStats(response.data?.stats || response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading stats:', error);
      return null;
    }
  }, []);

  return {
    capacitaciones,
    currentCapacitacion,
    cronograma,
    materiales,
    stats,
    pagination,
    loading,
    uploading,
    filters,
    setFilters,
    setPagination,
    setCurrentCapacitacion,
    loadCapacitaciones,
    loadCronograma,
    getCapacitacion,
    createCapacitacion,
    updateCapacitacion,
    deleteCapacitacion,
    loadMateriales,
    uploadMaterial,
    loadStats,
  };
}
