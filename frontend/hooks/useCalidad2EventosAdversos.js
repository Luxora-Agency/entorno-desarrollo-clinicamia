import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useCalidad2EventosAdversos() {
  const [eventos, setEventos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [eventosPorTipo, setEventosPorTipo] = useState([]);
  const [eventosPorSeveridad, setEventosPorSeveridad] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEventos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit,
        ...filters,
      }).toString();

      const response = await apiGet(`/calidad2/procesos-prioritarios/eventos-adversos?${params}`);
      setEventos(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar eventos adversos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchEstadisticas = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const data = await apiGet(`/calidad2/procesos-prioritarios/eventos-adversos/stats?${params}`);
      setEstadisticas(data);
      return data;
    } catch (err) {
      console.error('Error fetching stats:', err);
      throw err;
    }
  }, []);

  const fetchPorTipo = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const data = await apiGet(`/calidad2/procesos-prioritarios/eventos-adversos/por-tipo?${params}`);
      setEventosPorTipo(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching by type:', err);
      throw err;
    }
  }, []);

  const fetchPorSeveridad = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const data = await apiGet(`/calidad2/procesos-prioritarios/eventos-adversos/por-severidad?${params}`);
      setEventosPorSeveridad(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching by severity:', err);
      throw err;
    }
  }, []);

  const getEventoById = async (id) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/eventos-adversos/${id}`);
      return data;
    } catch (err) {
      toast.error('Error al cargar evento adverso');
      throw err;
    }
  };

  const createEvento = async (eventoData) => {
    try {
      const data = await apiPost('/calidad2/procesos-prioritarios/eventos-adversos', eventoData);
      toast.success('Evento adverso reportado exitosamente');

      // Refresh lists
      await Promise.all([fetchEventos(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al reportar evento adverso');
      throw err;
    }
  };

  const updateEvento = async (id, eventoData) => {
    try {
      const data = await apiPut(`/calidad2/procesos-prioritarios/eventos-adversos/${id}`, eventoData);
      toast.success('Evento adverso actualizado exitosamente');

      // Refresh lists
      await Promise.all([fetchEventos(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al actualizar evento adverso');
      throw err;
    }
  };

  const deleteEvento = async (id) => {
    try {
      await apiDelete(`/calidad2/procesos-prioritarios/eventos-adversos/${id}`);
      toast.success('Evento adverso eliminado exitosamente');

      // Refresh lists
      await Promise.all([fetchEventos(), fetchEstadisticas()]);
    } catch (err) {
      toast.error('Error al eliminar evento adverso');
      throw err;
    }
  };

  const analizarEvento = async (id, analisisData) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/eventos-adversos/${id}/analizar`, analisisData);
      toast.success('Análisis registrado exitosamente');

      // Refresh lists
      await Promise.all([fetchEventos(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al registrar análisis');
      throw err;
    }
  };

  const cerrarEvento = async (id, cierreData) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/eventos-adversos/${id}/cerrar`, cierreData);
      toast.success('Evento adverso cerrado exitosamente');

      // Refresh lists
      await Promise.all([fetchEventos(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al cerrar evento adverso');
      throw err;
    }
  };

  const uploadDocumento = async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await apiPost(`/calidad2/procesos-prioritarios/eventos-adversos/${id}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Documento cargado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al cargar documento');
      throw err;
    }
  };

  const refreshAll = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEventos(filters),
        fetchEstadisticas(filters),
        // TODO: Implement backend endpoints for these
        // fetchPorTipo(filters),
        // fetchPorSeveridad(filters),
      ]);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchEventos, fetchEstadisticas]);

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    eventos,
    estadisticas,
    eventosPorTipo,
    eventosPorSeveridad,
    pagination,
    loading,
    error,
    fetchEventos,
    fetchEstadisticas,
    fetchPorTipo,
    fetchPorSeveridad,
    getEventoById,
    createEvento,
    updateEvento,
    deleteEvento,
    analizarEvento,
    cerrarEvento,
    uploadDocumento,
    refreshAll,
  };
}
