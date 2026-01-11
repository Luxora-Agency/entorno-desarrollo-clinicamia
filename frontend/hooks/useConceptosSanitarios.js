import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useConceptosSanitarios() {
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });

  const loadConceptos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await apiGet(`/calidad2/infraestructura/conceptos-sanitarios?${params}`);
      setConceptos(response.data || []);
      setPagination(response.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      return response.data;
    } catch (error) {
      console.error('Error al cargar conceptos sanitarios:', error);
      toast.error('Error al cargar conceptos sanitarios');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadConceptosPorAnio = useCallback(async (anio) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/conceptos-sanitarios/anio/${anio}`);
      setConceptos(response.data || []);
      return response.data;
    } catch (error) {
      console.error('Error al cargar conceptos por año:', error);
      toast.error('Error al cargar conceptos del año');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getConcepto = useCallback(async (id) => {
    try {
      const response = await apiGet(`/calidad2/infraestructura/conceptos-sanitarios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener concepto:', error);
      toast.error('Error al obtener concepto sanitario');
      return null;
    }
  }, []);

  const createConcepto = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/infraestructura/conceptos-sanitarios', data);
      toast.success('Concepto sanitario creado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al crear concepto:', error);
      toast.error(error.response?.data?.message || 'Error al crear concepto sanitario');
      return null;
    }
  }, []);

  const updateConcepto = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/infraestructura/conceptos-sanitarios/${id}`, data);
      toast.success('Concepto sanitario actualizado');
      return response.data;
    } catch (error) {
      console.error('Error al actualizar concepto:', error);
      toast.error('Error al actualizar concepto sanitario');
      return null;
    }
  }, []);

  const updateItem = useCallback(async (conceptoId, itemId, data) => {
    try {
      const response = await apiPut(
        `/calidad2/infraestructura/conceptos-sanitarios/${conceptoId}/items/${itemId}`,
        data
      );
      toast.success('Ítem actualizado');
      return response.data;
    } catch (error) {
      console.error('Error al actualizar ítem:', error);
      toast.error('Error al actualizar ítem');
      return null;
    }
  }, []);

  const deleteConcepto = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/infraestructura/conceptos-sanitarios/${id}`);
      toast.success('Concepto sanitario eliminado');
      return true;
    } catch (error) {
      console.error('Error al eliminar concepto:', error);
      toast.error('Error al eliminar concepto sanitario');
      return false;
    }
  }, []);

  const uploadDocumento = useCallback(async (conceptoId, formData) => {
    try {
      const response = await apiPost(
        `/calidad2/infraestructura/conceptos-sanitarios/${conceptoId}/documentos`,
        formData
      );
      toast.success('Documento subido exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al subir documento:', error);
      toast.error('Error al subir documento');
      return null;
    }
  }, []);

  const deleteDocumento = useCallback(async (documentoId) => {
    try {
      await apiDelete(`/calidad2/infraestructura/conceptos-sanitarios/documentos/${documentoId}`);
      toast.success('Documento eliminado');
      return true;
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('Error al eliminar documento');
      return false;
    }
  }, []);

  const getEstadisticas = useCallback(async (anio) => {
    try {
      const response = await apiGet(`/calidad2/infraestructura/conceptos-sanitarios/estadisticas/${anio}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }, []);

  const getAniosDisponibles = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/infraestructura/conceptos-sanitarios/anios');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener años disponibles:', error);
      return [];
    }
  }, []);

  return {
    conceptos,
    loading,
    pagination,
    loadConceptos,
    loadConceptosPorAnio,
    getConcepto,
    createConcepto,
    updateConcepto,
    updateItem,
    deleteConcepto,
    uploadDocumento,
    deleteDocumento,
    getEstadisticas,
    getAniosDisponibles,
  };
}
