import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useSolicitudesVisita() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  const loadSolicitudes = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await apiGet(`/calidad2/infraestructura/solicitudes-visita?${params}`);
      setSolicitudes(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      return response.data;
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      toast.error('Error al cargar solicitudes de visita');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSolicitudesPorAnio = useCallback(async (anio) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/solicitudes-visita/anio/${anio}`);
      setSolicitudes(response.data || []);
      return response.data;
    } catch (error) {
      console.error('Error al cargar solicitudes por año:', error);
      toast.error('Error al cargar solicitudes del año');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getSolicitud = useCallback(async (id) => {
    try {
      const response = await apiGet(`/calidad2/infraestructura/solicitudes-visita/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener solicitud:', error);
      toast.error('Error al obtener solicitud de visita');
      return null;
    }
  }, []);

  const createSolicitud = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/infraestructura/solicitudes-visita', data);
      toast.success('Solicitud de visita creada');
      return response.data;
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      toast.error('Error al crear solicitud de visita');
      return null;
    }
  }, []);

  const updateSolicitud = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/infraestructura/solicitudes-visita/${id}`, data);
      toast.success('Solicitud actualizada');
      return response.data;
    } catch (error) {
      console.error('Error al actualizar solicitud:', error);
      toast.error('Error al actualizar solicitud');
      return null;
    }
  }, []);

  const cambiarEstado = useCallback(async (id, estado) => {
    try {
      const response = await apiPost(`/calidad2/infraestructura/solicitudes-visita/${id}/estado`, { estado });
      toast.success('Estado actualizado');
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar estado');
      return null;
    }
  }, []);

  const deleteSolicitud = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/infraestructura/solicitudes-visita/${id}`);
      toast.success('Solicitud eliminada');
      return true;
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      toast.error('Error al eliminar solicitud');
      return false;
    }
  }, []);

  const uploadDocumento = useCallback(async (solicitudId, formData) => {
    try {
      const response = await apiPost(
        `/calidad2/infraestructura/solicitudes-visita/${solicitudId}/documentos`,
        formData
      );
      toast.success('Documento subido');
      return response.data;
    } catch (error) {
      console.error('Error al subir documento:', error);
      toast.error('Error al subir documento');
      return null;
    }
  }, []);

  const deleteDocumento = useCallback(async (documentoId) => {
    try {
      await apiDelete(`/calidad2/infraestructura/solicitudes-visita/documentos/${documentoId}`);
      toast.success('Documento eliminado');
      return true;
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('Error al eliminar documento');
      return false;
    }
  }, []);

  const getProximas = useCallback(async (dias = 30) => {
    try {
      const response = await apiGet(`/calidad2/infraestructura/solicitudes-visita/proximas?dias=${dias}`);
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener solicitudes próximas:', error);
      return [];
    }
  }, []);

  const getEstadisticas = useCallback(async (anio) => {
    try {
      const response = await apiGet(`/calidad2/infraestructura/solicitudes-visita/estadisticas/${anio}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }, []);

  return {
    solicitudes,
    loading,
    pagination,
    loadSolicitudes,
    loadSolicitudesPorAnio,
    getSolicitud,
    createSolicitud,
    updateSolicitud,
    cambiarEstado,
    deleteSolicitud,
    uploadDocumento,
    deleteDocumento,
    getProximas,
    getEstadisticas,
  };
}
