import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useCalidad2IndicadoresPP() {
  const [indicadores, setIndicadores] = useState([]);
  const [mediciones, setMediciones] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIndicadores = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit,
        ...filters,
      }).toString();

      const response = await apiGet(`/calidad2/procesos-prioritarios/indicadores?${params}`);
      setIndicadores(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar indicadores');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchDashboard = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const data = await apiGet(`/calidad2/procesos-prioritarios/indicadores/stats/dashboard?${params}`);
      setDashboard(data);
      return data;
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      throw err;
    }
  }, []);

  const fetchMedicionesByIndicador = async (indicadorId) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/indicadores/${indicadorId}/mediciones`);
      setMediciones(data || []);
      return data;
    } catch (err) {
      toast.error('Error al cargar mediciones');
      throw err;
    }
  };

  const getIndicadorById = async (id) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/indicadores/${id}`);
      return data;
    } catch (err) {
      toast.error('Error al cargar indicador');
      throw err;
    }
  };

  const createIndicador = async (indicadorData) => {
    try {
      const data = await apiPost('/calidad2/procesos-prioritarios/indicadores', indicadorData);
      toast.success('Indicador creado exitosamente');
      await fetchIndicadores();
      return data;
    } catch (err) {
      toast.error('Error al crear indicador');
      throw err;
    }
  };

  const updateIndicador = async (id, indicadorData) => {
    try {
      const data = await apiPut(`/calidad2/procesos-prioritarios/indicadores/${id}`, indicadorData);
      toast.success('Indicador actualizado exitosamente');
      await fetchIndicadores();
      return data;
    } catch (err) {
      toast.error('Error al actualizar indicador');
      throw err;
    }
  };

  const deleteIndicador = async (id) => {
    try {
      await apiDelete(`/calidad2/procesos-prioritarios/indicadores/${id}`);
      toast.success('Indicador eliminado exitosamente');
      await fetchIndicadores();
    } catch (err) {
      toast.error('Error al eliminar indicador');
      throw err;
    }
  };

  const registrarMedicion = async (indicadorId, medicionData) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/indicadores/${indicadorId}/mediciones`, medicionData);
      toast.success('Medición registrada exitosamente');
      await fetchMedicionesByIndicador(indicadorId);
      return data;
    } catch (err) {
      toast.error('Error al registrar medición');
      throw err;
    }
  };

  const refreshAll = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      await Promise.all([fetchIndicadores(filters), fetchDashboard(filters)]);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchIndicadores, fetchDashboard]);

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    indicadores,
    mediciones,
    dashboard,
    pagination,
    loading,
    error,
    fetchIndicadores,
    fetchDashboard,
    fetchMedicionesByIndicador,
    getIndicadorById,
    createIndicador,
    updateIndicador,
    deleteIndicador,
    registrarMedicion,
    refreshAll,
  };
}
