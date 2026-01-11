import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useCalidad2Actas() {
  const [actas, setActas] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchActas = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit,
        ...filters,
      }).toString();

      const response = await apiGet(`/calidad2/procesos-prioritarios/actas?${params}`);
      setActas(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar actas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchActasByComite = useCallback(async (comiteId) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/actas/comite/${comiteId}`);
      return data || [];
    } catch (err) {
      console.error('Error fetching actas by comite:', err);
      throw err;
    }
  }, []);

  const getActaById = async (id) => {
    try {
      const data = await apiGet(`/calidad2/procesos-prioritarios/actas/${id}`);
      return data;
    } catch (err) {
      toast.error('Error al cargar acta');
      throw err;
    }
  };

  const createActa = async (actaData) => {
    try {
      const data = await apiPost('/calidad2/procesos-prioritarios/actas', actaData);
      toast.success('Acta creada exitosamente');

      // Refresh list
      await fetchActas();
      return data;
    } catch (err) {
      toast.error('Error al crear acta');
      throw err;
    }
  };

  const updateActa = async (id, actaData) => {
    try {
      const data = await apiPut(`/calidad2/procesos-prioritarios/actas/${id}`, actaData);
      toast.success('Acta actualizada exitosamente');

      // Refresh list
      await fetchActas();
      return data;
    } catch (err) {
      toast.error('Error al actualizar acta');
      throw err;
    }
  };

  const deleteActa = async (id) => {
    try {
      await apiDelete(`/calidad2/procesos-prioritarios/actas/${id}`);
      toast.success('Acta eliminada exitosamente');

      // Refresh list
      await fetchActas();
    } catch (err) {
      toast.error('Error al eliminar acta');
      throw err;
    }
  };

  const aprobarActa = async (id) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/actas/${id}/aprobar`);
      toast.success('Acta aprobada exitosamente');

      // Refresh list
      await fetchActas();
      return data;
    } catch (err) {
      toast.error('Error al aprobar acta');
      throw err;
    }
  };

  const addAsistente = async (actaId, asistenteData) => {
    try {
      const data = await apiPost(`/calidad2/procesos-prioritarios/actas/${actaId}/asistentes`, asistenteData);
      toast.success('Asistente registrado exitosamente');
      return data;
    } catch (err) {
      toast.error('Error al registrar asistente');
      throw err;
    }
  };

  const uploadDocumento = async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await apiPost(`/calidad2/procesos-prioritarios/actas/${id}/documentos`, formData, {
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
      await fetchActas(filters);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchActas]);

  useEffect(() => {
    refreshAll();
  }, []);

  return {
    actas,
    pagination,
    loading,
    error,
    fetchActas,
    fetchActasByComite,
    getActaById,
    createActa,
    updateActa,
    deleteActa,
    aprobarActa,
    addAsistente,
    uploadDocumento,
    refreshAll,
  };
}
