import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useCalidad2Comites() {
  const [comites, setComites] = useState([]);
  const [cronograma, setCronograma] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComites = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit,
        ...filters,
      }).toString();

      const response = await apiGet(`/calidad2/procesos-prioritarios/comites?${params}`);
      setComites(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar comités');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchCronograma = useCallback(async (comiteId, anio) => {
    try {
      const params = new URLSearchParams({ anio }).toString();
      const data = await apiGet(`/calidad2/procesos-prioritarios/comites/${comiteId}/cronograma?${params}`);
      setCronograma(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching cronograma:', err);
      throw err;
    }
  }, []);

  const getComiteById = async (id) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/comites/${id}`);
      return data;
    } catch (err) {
      toast.error('Error al cargar comité');
      throw err;
    }
  };

  const createComite = async (comiteData) => {
    try {
      const data = await apiPost('/calidad2/procesos-prioritarios/comites', comiteData);
      toast.success('Comité creado exitosamente');

      // Refresh list
      await fetchComites();
      return data;
    } catch (err) {
      toast.error('Error al crear comité');
      throw err;
    }
  };

  const updateComite = async (id, comiteData) => {
    try {
      const data = await apiPut(`/calidad2/procesos-prioritarios/comites/${id}`, comiteData);
      toast.success('Comité actualizado exitosamente');

      // Refresh list
      await fetchComites();
      return data;
    } catch (err) {
      toast.error('Error al actualizar comité');
      throw err;
    }
  };

  const deleteComite = async (id) => {
    try {
      await apiDelete(`/calidad2/procesos-prioritarios/comites/${id}`);
      toast.success('Comité eliminado exitosamente');

      // Refresh list
      await fetchComites();
    } catch (err) {
      toast.error('Error al eliminar comité');
      throw err;
    }
  };

  const addMiembro = async (comiteId, miembroData) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/comites/${comiteId}/miembros`, miembroData);
      toast.success('Miembro agregado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al agregar miembro');
      throw err;
    }
  };

  const removeMiembro = async (comiteId, miembroId) => {
    try {
      await apiDelete(`/calidad2/procesos-prioritarios/comites/${comiteId}/miembros/${miembroId}`);
      toast.success('Miembro removido exitosamente');
    } catch (err) {
      toast.error('Error al remover miembro');
      throw err;
    }
  };

  const createCronograma = async (comiteId, cronogramaData) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/comites/${comiteId}/cronograma`, cronogramaData);
      toast.success('Cronograma creado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al crear cronograma');
      throw err;
    }
  };

  const refreshAll = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      await fetchComites(filters);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchComites]);

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    comites,
    cronograma,
    estadisticas,
    pagination,
    loading,
    error,
    fetchComites,
    fetchCronograma,
    getComiteById,
    createComite,
    updateComite,
    deleteComite,
    addMiembro,
    removeMiembro,
    createCronograma,
    refreshAll,
  };
}
