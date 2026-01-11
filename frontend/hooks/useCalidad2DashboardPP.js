import { useState, useEffect } from 'react';
import { apiGet } from '@/services/api';

export function useCalidad2DashboardPP() {
  const [resumen, setResumen] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [graficas, setGraficas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResumen = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/calidad2/procesos-prioritarios/dashboard/resumen');
      setResumen(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const data = await apiGet(`/calidad2/procesos-prioritarios/dashboard/estadisticas?${params}`);
      setEstadisticas(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const fetchGraficas = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const data = await apiGet(`/calidad2/procesos-prioritarios/dashboard/graficas?${params}`);
      setGraficas(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const refreshAll = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchResumen(),
        fetchEstadisticas(filters),
        fetchGraficas(filters),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumen();
  }, []);

  return {
    resumen,
    estadisticas,
    graficas,
    loading,
    error,
    fetchResumen,
    fetchEstadisticas,
    fetchGraficas,
    refreshAll,
  };
}
