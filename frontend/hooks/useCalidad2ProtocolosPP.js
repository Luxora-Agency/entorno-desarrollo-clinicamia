import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useCalidad2ProtocolosPP() {
  const [protocolos, setProtocolos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProtocolos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit,
        ...filters,
      }).toString();

      const response = await apiGet(`/calidad2/procesos-prioritarios/protocolos?${params}`);
      setProtocolos(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar protocolos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const data = await apiGet('/calidad2/procesos-prioritarios/protocolos/stats');
      setEstadisticas(data);
      return data;
    } catch (err) {
      console.error('Error fetching stats:', err);
      throw err;
    }
  }, []);

  const getProtocoloById = async (id) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/protocolos/${id}`);
      return data;
    } catch (err) {
      toast.error('Error al cargar protocolo');
      throw err;
    }
  };

  const createProtocolo = async (protocoloData) => {
    try {
      const data = await apiPost('/calidad2/procesos-prioritarios/protocolos', protocoloData);
      toast.success('Protocolo creado exitosamente');
      await Promise.all([fetchProtocolos(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al crear protocolo');
      throw err;
    }
  };

  const updateProtocolo = async (id, protocoloData) => {
    try {
      const data = await apiPut(`/calidad2/procesos-prioritarios/protocolos/${id}`, protocoloData);
      toast.success('Protocolo actualizado exitosamente');
      await Promise.all([fetchProtocolos(), fetchEstadisticas()]);
      return data;
    } catch (err) {
      toast.error('Error al actualizar protocolo');
      throw err;
    }
  };

  const deleteProtocolo = async (id) => {
    try {
      await apiDelete(`/calidad2/procesos-prioritarios/protocolos/${id}`);
      toast.success('Protocolo eliminado exitosamente');
      await Promise.all([fetchProtocolos(), fetchEstadisticas()]);
    } catch (err) {
      toast.error('Error al eliminar protocolo');
      throw err;
    }
  };

  const aprobarProtocolo = async (id) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/protocolos/${id}/aprobar`);
      toast.success('Protocolo aprobado exitosamente');
      await fetchProtocolos();
      return data;
    } catch (err) {
      toast.error('Error al aprobar protocolo');
      throw err;
    }
  };

  const refreshAll = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      await Promise.all([fetchProtocolos(filters), fetchEstadisticas()]);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchProtocolos, fetchEstadisticas]);

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    protocolos,
    estadisticas,
    pagination,
    loading,
    error,
    fetchProtocolos,
    fetchEstadisticas,
    getProtocoloById,
    createProtocolo,
    updateProtocolo,
    deleteProtocolo,
    aprobarProtocolo,
    refreshAll,
  };
}
