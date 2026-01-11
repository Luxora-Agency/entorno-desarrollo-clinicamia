import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useSesionesCapacitacion() {
  const [sesiones, setSesiones] = useState([]);
  const [currentSesion, setCurrentSesion] = useState(null);
  const [asistentes, setAsistentes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadSesiones = useCallback(async (capacitacionId, params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...params,
      };

      const response = await apiGet(`/calidad2/capacitaciones/${capacitacionId}/sesiones`, queryParams);
      setSesiones(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      return response.data;
    } catch (error) {
      console.error('Error loading sesiones:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar las sesiones.',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, toast]);

  const getSesion = useCallback(async (sesionId) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/capacitaciones/sesiones/${sesionId}`);
      setCurrentSesion(response.data?.sesion || response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting sesion:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la sesión.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createSesion = useCallback(async (capacitacionId, data) => {
    try {
      const response = await apiPost(`/calidad2/capacitaciones/${capacitacionId}/sesiones`, data);
      toast({
        title: 'Sesión creada',
        description: 'La sesión se ha programado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      return response.data?.sesion || response.data;
    } catch (error) {
      console.error('Error creating sesion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear la sesión.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateSesion = useCallback(async (sesionId, data) => {
    try {
      const response = await apiPut(`/calidad2/capacitaciones/sesiones/${sesionId}`, data);
      toast({
        title: 'Sesión actualizada',
        description: 'La sesión se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentSesion?.id === sesionId) {
        setCurrentSesion(response.data?.sesion || response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error updating sesion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la sesión.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentSesion, toast]);

  const deleteSesion = useCallback(async (sesionId) => {
    try {
      await apiDelete(`/calidad2/capacitaciones/sesiones/${sesionId}`);
      toast({
        title: 'Sesión eliminada',
        description: 'La sesión se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      return true;
    } catch (error) {
      console.error('Error deleting sesion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la sesión.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const iniciarSesion = useCallback(async (sesionId) => {
    try {
      const response = await apiPut(`/calidad2/capacitaciones/sesiones/${sesionId}/iniciar`);
      toast({
        title: 'Sesión iniciada',
        description: 'La capacitación ha comenzado.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentSesion?.id === sesionId) {
        setCurrentSesion(response.data?.sesion || response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error starting sesion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo iniciar la sesión.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentSesion, toast]);

  const finalizarSesion = useCallback(async (sesionId) => {
    try {
      const response = await apiPut(`/calidad2/capacitaciones/sesiones/${sesionId}/finalizar`);
      toast({
        title: 'Sesión finalizada',
        description: 'La capacitación ha finalizado y se generó el acta.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      if (currentSesion?.id === sesionId) {
        setCurrentSesion(response.data?.sesion || response.data);
      }
      return response.data;
    } catch (error) {
      console.error('Error finishing sesion:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo finalizar la sesión.',
        variant: 'destructive',
      });
      return null;
    }
  }, [currentSesion, toast]);

  // Asistentes
  const loadAsistentes = useCallback(async (sesionId) => {
    try {
      const response = await apiGet(`/calidad2/capacitaciones/sesiones/${sesionId}/asistentes`);
      setAsistentes(response.data?.asistentes || []);
      return response.data;
    } catch (error) {
      console.error('Error loading asistentes:', error);
      return [];
    }
  }, []);

  const addAsistentes = useCallback(async (sesionId, asistentesData) => {
    try {
      const response = await apiPost(`/calidad2/capacitaciones/sesiones/${sesionId}/asistentes`, {
        asistentes: asistentesData,
      });
      toast({
        title: 'Asistentes agregados',
        description: 'Los asistentes se han agregado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadAsistentes(sesionId);
      return response.data;
    } catch (error) {
      console.error('Error adding asistentes:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo agregar los asistentes.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadAsistentes, toast]);

  const updateAsistente = useCallback(async (sesionId, asistenteId, data) => {
    try {
      const response = await apiPut(
        `/calidad2/capacitaciones/sesiones/${sesionId}/asistentes/${asistenteId}`,
        data
      );
      toast({
        title: 'Asistente actualizado',
        description: 'La información del asistente se ha actualizado.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadAsistentes(sesionId);
      return response.data;
    } catch (error) {
      console.error('Error updating asistente:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el asistente.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadAsistentes, toast]);

  const removeAsistente = useCallback(async (sesionId, asistenteId) => {
    try {
      await apiDelete(`/calidad2/capacitaciones/sesiones/${sesionId}/asistentes/${asistenteId}`);
      toast({
        title: 'Asistente eliminado',
        description: 'El asistente se ha eliminado de la sesión.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadAsistentes(sesionId);
      return true;
    } catch (error) {
      console.error('Error removing asistente:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el asistente.',
        variant: 'destructive',
      });
      return false;
    }
  }, [loadAsistentes, toast]);

  const marcarAsistenciaMasiva = useCallback(async (sesionId, asistentesIds, asistio = true) => {
    try {
      const response = await apiPost(`/calidad2/capacitaciones/sesiones/${sesionId}/asistencia-masiva`, {
        asistentesIds,
        asistio,
      });
      toast({
        title: 'Asistencia marcada',
        description: `Se marcó la asistencia de ${asistentesIds.length} participantes.`,
        className: 'bg-green-50 border-green-200 text-green-800',
      });
      loadAsistentes(sesionId);
      return response.data;
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo marcar la asistencia.',
        variant: 'destructive',
      });
      return null;
    }
  }, [loadAsistentes, toast]);

  return {
    sesiones,
    currentSesion,
    asistentes,
    pagination,
    loading,
    setPagination,
    setCurrentSesion,
    loadSesiones,
    getSesion,
    createSesion,
    updateSesion,
    deleteSesion,
    iniciarSesion,
    finalizarSesion,
    loadAsistentes,
    addAsistentes,
    updateAsistente,
    removeAsistente,
    marcarAsistenciaMasiva,
  };
}
