import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/services/api';
import { toast } from 'sonner';

export function useCalidad2AlertasPP() {
  const [alertas, setAlertas] = useState([]);
  const [alertasActivas, setAlertasActivas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlertas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit,
        ...filters,
      }).toString();

      const response = await apiGet(`/calidad2/procesos-prioritarios/alertas?${params}`);
      setAlertas(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar alertas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchAlertasActivas = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/procesos-prioritarios/alertas/activas');
      setAlertasActivas(response.data || []);
      return response.data;
    } catch (err) {
      console.error('Error fetching active alerts:', err);
      throw err;
    }
  }, []);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const data = await apiGet('/calidad2/procesos-prioritarios/alertas/stats/general');
      setEstadisticas(data);
      return data;
    } catch (err) {
      console.error('Error fetching stats:', err);
      throw err;
    }
  }, []);

  const atenderAlerta = async (id, observaciones) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/alertas/${id}/atender`, {
        observaciones,
      });
      toast.success('Alerta atendida exitosamente');

      // Refresh lists
      await Promise.all([fetchAlertas(), fetchAlertasActivas(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al atender alerta');
      throw err;
    }
  };

  const generarAlertas = async () => {
    try {
      setLoading(true);
      const data = await apiPost('/calidad2/procesos-prioritarios/alertas/generar');
      toast.success(`${data.generadas} alertas generadas`);

      // Refresh lists
      await Promise.all([fetchAlertas(), fetchAlertasActivas(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al generar alertas');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAlertas(),
        fetchAlertasActivas(),
        fetchEstadisticas(),
      ]);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchAlertas, fetchAlertasActivas, fetchEstadisticas]);

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    alertas,
    alertasActivas,
    estadisticas,
    pagination,
    loading,
    error,
    fetchAlertas,
    fetchAlertasActivas,
    fetchEstadisticas,
    atenderAlerta,
    generarAlertas,
    refreshAll,
  };
}
