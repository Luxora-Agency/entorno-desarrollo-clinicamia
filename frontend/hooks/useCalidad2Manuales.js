import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCalidad2Manuales() {
  const [manuales, setManuales] = useState([]);
  const [currentManual, setCurrentManual] = useState(null);
  const [stats, setStats] = useState(null);
  const [areas, setAreas] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    nivel: '',
    estado: '',
    area: '',
  });

  const loadManuales = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      };
      // Remove empty values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null) {
          delete queryParams[key];
        }
      });

      const response = await apiGet('/calidad2/manuales', queryParams);
      setManuales(Array.isArray(response.data) ? response.data : []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading manuales:', error);
      setManuales([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los manuales de funciones.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  const getManual = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/manuales/${id}`);
      setCurrentManual(response.data?.manual || response.data);
      return response.data?.manual || response.data;
    } catch (error) {
      console.error('Error getting manual:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el manual de funciones.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createManual = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/manuales', data);
      toast({
        title: 'Manual creado',
        description: 'El manual de funciones se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadManuales();
      return response.data?.manual || response.data;
    } catch (error) {
      console.error('Error creating manual:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el manual de funciones.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadManuales, toast]);

  const updateManual = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/manuales/${id}`, data);
      toast({
        title: 'Manual actualizado',
        description: 'El manual de funciones se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadManuales();
      if (currentManual?.id === id) {
        setCurrentManual(response.data?.manual || response.data);
      }
      return response.data?.manual || response.data;
    } catch (error) {
      console.error('Error updating manual:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el manual de funciones.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadManuales, currentManual, toast]);

  const deleteManual = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/manuales/${id}`);
      toast({
        title: 'Manual eliminado',
        description: 'El manual de funciones se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadManuales();
      if (currentManual?.id === id) {
        setCurrentManual(null);
      }
      return true;
    } catch (error) {
      console.error('Error deleting manual:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el manual de funciones.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadManuales, currentManual, toast]);

  const aprobarManual = useCallback(async (id) => {
    try {
      const response = await apiPost(`/calidad2/manuales/${id}/aprobar`);
      toast({
        title: 'Manual aprobado',
        description: 'El manual de funciones ahora está vigente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadManuales();
      if (currentManual?.id === id) {
        setCurrentManual(response.data?.manual || response.data);
      }
      return response.data?.manual || response.data;
    } catch (error) {
      console.error('Error approving manual:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aprobar el manual de funciones.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadManuales, currentManual, toast]);

  const marcarObsoleto = useCallback(async (id) => {
    try {
      const response = await apiPost(`/calidad2/manuales/${id}/obsoleto`);
      toast({
        title: 'Manual obsoleto',
        description: 'El manual de funciones se ha marcado como obsoleto.',
        className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      });
      loadManuales();
      if (currentManual?.id === id) {
        setCurrentManual(response.data?.manual || response.data);
      }
      return response.data?.manual || response.data;
    } catch (error) {
      console.error('Error marking manual as obsolete:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo marcar el manual como obsoleto.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadManuales, currentManual, toast]);

  const duplicarManual = useCallback(async (id, data = {}) => {
    try {
      setLoading(true);
      const response = await apiPost(`/calidad2/manuales/${id}/duplicar`, data);
      toast({
        title: 'Manual duplicado',
        description: 'Se ha creado una copia del manual de funciones.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadManuales();
      return response.data?.manual || response.data;
    } catch (error) {
      console.error('Error duplicating manual:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo duplicar el manual de funciones.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadManuales, toast]);

  // Stats
  const loadStats = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/manuales/stats');
      setStats(response.data?.stats || response.data);
      return response.data?.stats || response.data;
    } catch (error) {
      console.error('Error loading stats:', error);
      return null;
    }
  }, []);

  // Areas
  const loadAreas = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/manuales/areas');
      const areasData = response.data?.areas || [];
      setAreas(areasData);
      return areasData;
    } catch (error) {
      console.error('Error loading areas:', error);
      return [];
    }
  }, []);

  // Clear current manual
  const clearCurrentManual = useCallback(() => {
    setCurrentManual(null);
  }, []);

  return {
    manuales,
    currentManual,
    stats,
    areas,
    pagination,
    loading,
    filters,
    setFilters,
    setPagination,
    loadManuales,
    getManual,
    createManual,
    updateManual,
    deleteManual,
    aprobarManual,
    marcarObsoleto,
    duplicarManual,
    loadStats,
    loadAreas,
    clearCurrentManual,
  };
}
