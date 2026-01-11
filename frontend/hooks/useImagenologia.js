import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiPatch } from '../services/api';
import { useToast } from './use-toast';

export const useImagenologia = () => {
  const [estudios, setEstudios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const { toast } = useToast();

  const fetchEstudios = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const response = await apiGet('/imagenologia', filters);
      setEstudios(response.items || []);
      return response;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los estudios',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiGet('/imagenologia/estadisticas');
      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const createEstudio = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await apiPost('/imagenologia', data);
      toast({
        title: 'Éxito',
        description: 'Estudio solicitado correctamente',
      });
      // Recargar lista si es necesario
      return response.data;
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Error al solicitar estudio',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateInforme = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await apiPut(`/imagenologia/${id}/informe`, data);
      toast({
        title: 'Éxito',
        description: 'Informe guardado correctamente',
      });
      return response.data;
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateEstado = useCallback(async (id, estado, fechaProgramada) => {
    setLoading(true);
    try {
        const response = await apiPatch(`/imagenologia/${id}/estado`, { estado, fechaProgramada });
        toast({
            title: 'Éxito',
            description: 'Estado actualizado',
        });
        return response.data;
    } catch (error) {
        toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
        });
        throw error;
    } finally {
        setLoading(false);
    }
  }, [toast]);

  return {
    estudios,
    loading,
    stats,
    fetchEstudios,
    fetchStats,
    createEstudio,
    updateInforme,
    updateEstado
  };
};
