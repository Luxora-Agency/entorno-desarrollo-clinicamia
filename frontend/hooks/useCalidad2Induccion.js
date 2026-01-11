import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCalidad2Induccion() {
  const [procesos, setProcesos] = useState([]);
  const [currentProceso, setCurrentProceso] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filtros
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    personalId: '',
    search: '',
  });

  const loadProcesos = useCallback(async (params = {}) => {
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

      const response = await apiGet('/calidad2/induccion', queryParams);
      setProcesos(Array.isArray(response.data) ? response.data : []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error loading procesos:', error);
      setProcesos([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los procesos de inducción.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  const getProceso = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/induccion/${id}`);
      setCurrentProceso(response.data?.proceso || response.data);
      return response.data?.proceso || response.data;
    } catch (error) {
      console.error('Error getting proceso:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el proceso de inducción.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createProceso = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/induccion', data);
      toast({
        title: 'Proceso creado',
        description: 'El proceso de inducción se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadProcesos();
      return response.data?.proceso || response.data;
    } catch (error) {
      console.error('Error creating proceso:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el proceso de inducción.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadProcesos, toast]);

  const updateProceso = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/induccion/${id}`, data);
      toast({
        title: 'Proceso actualizado',
        description: 'El proceso de inducción se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadProcesos();
      if (currentProceso?.id === id) {
        setCurrentProceso(response.data?.proceso || response.data);
      }
      return response.data?.proceso || response.data;
    } catch (error) {
      console.error('Error updating proceso:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el proceso.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadProcesos, currentProceso, toast]);

  const deleteProceso = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/induccion/${id}`);
      toast({
        title: 'Proceso eliminado',
        description: 'El proceso de inducción se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadProcesos();
      if (currentProceso?.id === id) {
        setCurrentProceso(null);
      }
      return true;
    } catch (error) {
      console.error('Error deleting proceso:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el proceso.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadProcesos, currentProceso, toast]);

  const iniciarProceso = useCallback(async (id) => {
    try {
      const response = await apiPut(`/calidad2/induccion/${id}/iniciar`);
      toast({
        title: 'Proceso iniciado',
        description: 'El proceso de inducción ha sido iniciado.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadProcesos();
      return response.data?.proceso || response.data;
    } catch (error) {
      console.error('Error iniciando proceso:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo iniciar el proceso.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadProcesos, toast]);

  const completarProceso = useCallback(async (id) => {
    try {
      const response = await apiPut(`/calidad2/induccion/${id}/completar`);
      toast({
        title: 'Proceso completado',
        description: 'El proceso de inducción ha sido completado.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadProcesos();
      return response.data?.proceso || response.data;
    } catch (error) {
      console.error('Error completando proceso:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo completar el proceso.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadProcesos, toast]);

  const cancelarProceso = useCallback(async (id, motivo) => {
    try {
      const response = await apiPut(`/calidad2/induccion/${id}/cancelar`, { motivo });
      toast({
        title: 'Proceso cancelado',
        description: 'El proceso de inducción ha sido cancelado.',
        className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      });
      loadProcesos();
      return response.data?.proceso || response.data;
    } catch (error) {
      console.error('Error cancelando proceso:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cancelar el proceso.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadProcesos, toast]);

  // Fases
  const addFase = useCallback(async (procesoId, data) => {
    try {
      const response = await apiPost(`/calidad2/induccion/${procesoId}/fases`, data);
      toast({
        title: 'Fase agregada',
        description: 'La fase ha sido agregada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentProceso?.id === procesoId) {
        getProceso(procesoId);
      }
      return response.data?.fase || response.data;
    } catch (error) {
      console.error('Error adding fase:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar la fase.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentProceso, getProceso, toast]);

  const updateFase = useCallback(async (faseId, data) => {
    try {
      const response = await apiPut(`/calidad2/induccion/fases/${faseId}`, data);
      toast({
        title: 'Fase actualizada',
        description: 'La fase ha sido actualizada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentProceso) {
        getProceso(currentProceso.id);
      }
      return response.data?.fase || response.data;
    } catch (error) {
      console.error('Error updating fase:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la fase.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentProceso, getProceso, toast]);

  const completarFase = useCallback(async (faseId) => {
    try {
      const response = await apiPut(`/calidad2/induccion/fases/${faseId}/completar`);
      toast({
        title: 'Fase completada',
        description: 'La fase ha sido marcada como completada.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentProceso) {
        getProceso(currentProceso.id);
      }
      return response.data?.fase || response.data;
    } catch (error) {
      console.error('Error completando fase:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo completar la fase.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentProceso, getProceso, toast]);

  const deleteFase = useCallback(async (faseId) => {
    try {
      await apiDelete(`/calidad2/induccion/fases/${faseId}`);
      toast({
        title: 'Fase eliminada',
        description: 'La fase ha sido eliminada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentProceso) {
        getProceso(currentProceso.id);
      }
      return true;
    } catch (error) {
      console.error('Error deleting fase:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la fase.',
        variant: 'destructive',
      });
      return false;
    }
  }, [currentProceso, getProceso, toast]);

  // Evaluación
  const registrarEvaluacion = useCallback(async (procesoId, data) => {
    try {
      const response = await apiPost(`/calidad2/induccion/${procesoId}/evaluacion`, data);
      toast({
        title: 'Evaluación registrada',
        description: 'La evaluación ha sido registrada correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentProceso?.id === procesoId) {
        getProceso(procesoId);
      }
      return response.data?.evaluacion || response.data;
    } catch (error) {
      console.error('Error registrando evaluación:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo registrar la evaluación.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentProceso, getProceso, toast]);

  // Stats
  const loadStats = useCallback(async (anio) => {
    try {
      const response = await apiGet('/calidad2/induccion/stats', { anio });
      setStats(response.data?.stats || response.data);
      return response.data?.stats || response.data;
    } catch (error) {
      console.error('Error loading stats:', error);
      return null;
    }
  }, []);

  const clearCurrentProceso = useCallback(() => {
    setCurrentProceso(null);
  }, []);

  return {
    procesos,
    currentProceso,
    stats,
    pagination,
    loading,
    filters,
    setFilters,
    setPagination,
    loadProcesos,
    getProceso,
    createProceso,
    updateProceso,
    deleteProceso,
    iniciarProceso,
    completarProceso,
    cancelarProceso,
    addFase,
    updateFase,
    completarFase,
    deleteFase,
    registrarEvaluacion,
    loadStats,
    clearCurrentProceso,
  };
}
