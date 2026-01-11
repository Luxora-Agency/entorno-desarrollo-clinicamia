import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useCalidad2Encuestas() {
  const [encuestas, setEncuestas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [analisisPeriodo, setAnalisisPeriodo] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEncuestas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit,
        ...filters,
      }).toString();

      const response = await apiGet(`/calidad2/procesos-prioritarios/encuestas?${params}`);
      setEncuestas(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar encuestas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchEstadisticas = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const data = await apiGet(`/calidad2/procesos-prioritarios/encuestas/stats/general?${params}`);
      setEstadisticas(data);
      return data;
    } catch (err) {
      console.error('Error fetching stats:', err);
      throw err;
    }
  }, []);

  const fetchAnalisisPeriodo = useCallback(async (periodo) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/encuestas/analisis/${periodo}`);
      setAnalisisPeriodo(data);
      return data;
    } catch (err) {
      console.error('Error fetching analysis:', err);
      toast.error('Error al cargar análisis del período');
      throw err;
    }
  }, []);

  const getEncuestaById = async (id) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/encuestas/${id}`);
      return data;
    } catch (err) {
      toast.error('Error al cargar encuesta');
      throw err;
    }
  };

  const createEncuesta = async (encuestaData) => {
    try {
      const data = await apiPost('/calidad2/procesos-prioritarios/encuestas', encuestaData);
      toast.success('Encuesta registrada exitosamente');

      // Refresh lists
      await Promise.all([fetchEncuestas(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al registrar encuesta');
      throw err;
    }
  };

  const updateEncuesta = async (id, encuestaData) => {
    try {
      const data = await apiPut(`/calidad2/procesos-prioritarios/encuestas/${id}`, encuestaData);
      toast.success('Encuesta actualizada exitosamente');

      // Refresh lists
      await Promise.all([fetchEncuestas(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al actualizar encuesta');
      throw err;
    }
  };

  const deleteEncuesta = async (id) => {
    try {
      await apiDelete(`/calidad2/procesos-prioritarios/encuestas/${id}`);
      toast.success('Encuesta eliminada exitosamente');

      // Refresh lists
      await Promise.all([fetchEncuestas(), fetchEstadisticas()]);
    } catch (err) {
      toast.error('Error al eliminar encuesta');
      throw err;
    }
  };

  const refreshAll = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEncuestas(filters),
        fetchEstadisticas(filters),
      ]);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchEncuestas, fetchEstadisticas]);

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    encuestas,
    estadisticas,
    analisisPeriodo,
    pagination,
    loading,
    error,
    fetchEncuestas,
    fetchEstadisticas,
    fetchAnalisisPeriodo,
    getEncuestaById,
    createEncuesta,
    updateEncuesta,
    deleteEncuesta,
    refreshAll,
  };
}
