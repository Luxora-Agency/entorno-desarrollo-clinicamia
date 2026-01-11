import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useCalidad2GPC() {
  const [guias, setGuias] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGuias = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit,
        ...filters,
      }).toString();

      const response = await apiGet(`/calidad2/procesos-prioritarios/gpc?${params}`);
      setGuias(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar guías');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const data = await apiGet('/calidad2/procesos-prioritarios/gpc/stats');
      setEstadisticas(data);
      return data;
    } catch (err) {
      console.error('Error fetching stats:', err);
      throw err;
    }
  }, []);

  const getGuiaById = async (id) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/gpc/${id}`);
      return data;
    } catch (err) {
      toast.error('Error al cargar guía');
      throw err;
    }
  };

  const createGuia = async (guiaData) => {
    try {
      const data = await apiPost('/calidad2/procesos-prioritarios/gpc', guiaData);
      toast.success('Guía creada exitosamente');
      await Promise.all([fetchGuias(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al crear guía');
      throw err;
    }
  };

  const updateGuia = async (id, guiaData) => {
    try {
      const data = await apiPut(`/calidad2/procesos-prioritarios/gpc/${id}`, guiaData);
      toast.success('Guía actualizada exitosamente');
      await Promise.all([fetchGuias(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al actualizar guía');
      throw err;
    }
  };

  const deleteGuia = async (id) => {
    try {
      await apiDelete(`/calidad2/procesos-prioritarios/gpc/${id}`);
      toast.success('Guía eliminada exitosamente');
      await Promise.all([fetchGuias(), fetchEstadisticas()]);
    } catch (err) {
      toast.error('Error al eliminar guía');
      throw err;
    }
  };

  const evaluarAGREE = async (id, evaluacionData) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/gpc/${id}/evaluacion-agree`, evaluacionData);
      toast.success('Evaluación AGREE II registrada');
      await fetchGuias();
      return data;
    } catch (err) {
      toast.error('Error al registrar evaluación');
      throw err;
    }
  };

  const registrarAdherencia = async (id, adherenciaData) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/gpc/${id}/adherencia`, adherenciaData);
      toast.success('Adherencia registrada');
      await fetchGuias();
      return data;
    } catch (err) {
      toast.error('Error al registrar adherencia');
      throw err;
    }
  };

  const refreshAll = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      await Promise.all([fetchGuias(filters), fetchEstadisticas()]);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchGuias, fetchEstadisticas]);

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    guias,
    estadisticas,
    pagination,
    loading,
    error,
    fetchGuias,
    fetchEstadisticas,
    getGuiaById,
    createGuia,
    updateGuia,
    deleteGuia,
    evaluarAGREE,
    registrarAdherencia,
    refreshAll,
  };
}
