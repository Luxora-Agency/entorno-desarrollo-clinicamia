import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useCalidad2PQRSF() {
  const [pqrsf, setPqrsf] = useState([]);
  const [pqrsfVencidas, setPqrsfVencidas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPQRSF = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit,
        ...filters,
      }).toString();

      const response = await apiGet(`/calidad2/procesos-prioritarios/pqrsf?${params}`);
      setPqrsf(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar PQRSF');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchPQRSFVencidas = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/procesos-prioritarios/pqrsf/stats/vencidas');
      setPqrsfVencidas(response.data || []);
      return response.data;
    } catch (err) {
      console.error('Error fetching vencidas:', err);
      throw err;
    }
  }, []);

  const fetchEstadisticas = useCallback(async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const data = await apiGet(`/calidad2/procesos-prioritarios/pqrsf/stats/general?${params}`);
      setEstadisticas(data);
      return data;
    } catch (err) {
      console.error('Error fetching stats:', err);
      throw err;
    }
  }, []);

  const getPQRSFById = async (id) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/pqrsf/${id}`);
      return data;
    } catch (err) {
      toast.error('Error al cargar PQRSF');
      throw err;
    }
  };

  const createPQRSF = async (pqrsfData) => {
    try {
      const data = await apiPost('/calidad2/procesos-prioritarios/pqrsf', pqrsfData);
      toast.success('PQRSF radicada exitosamente');

      // Refresh lists
      await Promise.all([fetchPQRSF(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al radicar PQRSF');
      throw err;
    }
  };

  const updatePQRSF = async (id, pqrsfData) => {
    try {
      const data = await apiPut(`/calidad2/procesos-prioritarios/pqrsf/${id}`, pqrsfData);
      toast.success('PQRSF actualizada exitosamente');

      // Refresh lists
      await Promise.all([fetchPQRSF(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al actualizar PQRSF');
      throw err;
    }
  };

  const deletePQRSF = async (id) => {
    try {
      await apiDelete(`/calidad2/procesos-prioritarios/pqrsf/${id}`);
      toast.success('PQRSF eliminada exitosamente');

      // Refresh lists
      await Promise.all([fetchPQRSF(), fetchEstadisticas()]);
    } catch (err) {
      toast.error('Error al eliminar PQRSF');
      throw err;
    }
  };

  const responderPQRSF = async (id, respuestaData) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/pqrsf/${id}/responder`, respuestaData);
      toast.success('Respuesta enviada exitosamente');

      // Refresh lists
      await Promise.all([fetchPQRSF(), fetchPQRSFVencidas(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al enviar respuesta');
      throw err;
    }
  };

  const seguimientoPQRSF = async (id, seguimientoData) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/pqrsf/${id}/seguimiento`, seguimientoData);
      toast.success('Seguimiento registrado exitosamente');

      // Refresh lists
      await Promise.all([fetchPQRSF(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al registrar seguimiento');
      throw err;
    }
  };

  const uploadDocumento = async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await apiPost(`/calidad2/procesos-prioritarios/pqrsf/${id}/documentos`, formData, {
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
        fetchPQRSF(filters),
        fetchPQRSFVencidas(),
        fetchEstadisticas(filters),
      ]);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchPQRSF, fetchPQRSFVencidas, fetchEstadisticas]);

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    pqrsf,
    pqrsfVencidas,
    estadisticas,
    pagination,
    loading,
    error,
    fetchPQRSF,
    fetchPQRSFVencidas,
    fetchEstadisticas,
    getPQRSFById,
    createPQRSF,
    updatePQRSF,
    deletePQRSF,
    responderPQRSF,
    seguimientoPQRSF,
    uploadDocumento,
    refreshAll,
  };
}
