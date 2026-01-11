import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useInfraestructuraDocumentosLegales() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  const loadDocumentos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters).toString();
      const response = await apiGet(`/calidad2/infraestructura/documentos-legales${params ? `?${params}` : ''}`);

      setDocumentos(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });

      return response.data;
    } catch (error) {
      toast.error('Error al cargar documentos legales');
      console.error(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumento = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/documentos-legales/${id}`);
      return response.data;
    } catch (error) {
      toast.error('Error al obtener documento');
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createDocumento = useCallback(async (formData) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/infraestructura/documentos-legales', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Documento legal creado exitosamente');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Error al crear documento legal');
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocumento = useCallback(async (id, formData) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/infraestructura/documentos-legales/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Documento legal actualizado');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Error al actualizar documento');
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocumento = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/documentos-legales/${id}`);
      toast.success('Documento legal eliminado');
      return true;
    } catch (error) {
      toast.error('Error al eliminar documento');
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticas = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/infraestructura/documentos-legales/stats');
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, []);

  const getProximosAVencer = useCallback(async (dias = 30) => {
    try {
      const response = await apiGet(`/calidad2/infraestructura/documentos-legales/proximos-vencer?dias=${dias}`);
      return response.data || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  const getVencidos = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/infraestructura/documentos-legales/vencidos');
      return response.data || [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }, []);

  return {
    documentos,
    loading,
    pagination,
    loadDocumentos,
    getDocumento,
    createDocumento,
    updateDocumento,
    deleteDocumento,
    getEstadisticas,
    getProximosAVencer,
    getVencidos,
  };
}
