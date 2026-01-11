import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/services/api';
import { toast } from 'sonner';

export function useInfraestructuraAuditorias() {
  const [auditorias, setAuditorias] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Cargar auditorías con filtros
   */
  const loadAuditorias = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.anio) params.append('anio', filters.anio);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await apiGet(`/calidad2/infraestructura/auditorias?${params.toString()}`);
      setAuditorias(response.data || []);
      return response;
    } catch (error) {
      console.error('Error al cargar auditorías:', error);
      toast.error(error.response?.data?.message || 'Error al cargar auditorías');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear nueva auditoría
   */
  const createAuditoria = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/infraestructura/auditorias', data);

      // Actualizar la lista local inmediatamente
      setAuditorias(prev => [response.data, ...prev]);

      toast.success('Auditoría creada exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al crear auditoría:', error);
      toast.error(error.message || 'Error al crear auditoría');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar auditoría
   */
  const updateAuditoria = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/infraestructura/auditorias/${id}`, data);

      // Actualizar la lista local
      setAuditorias(prev =>
        prev.map(aud => aud.id === id ? response.data : aud)
      );

      toast.success('Auditoría actualizada exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al actualizar auditoría:', error);
      toast.error(error.message || 'Error al actualizar auditoría');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar auditoría
   */
  const deleteAuditoria = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/auditorias/${id}`);

      // Actualizar la lista local
      setAuditorias(prev => prev.filter(aud => aud.id !== id));

      toast.success('Auditoría eliminada exitosamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar auditoría:', error);
      toast.error(error.message || 'Error al eliminar auditoría');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cambiar estado de auditoría
   */
  const cambiarEstado = useCallback(async (id, nuevoEstado) => {
    try {
      setLoading(true);
      const response = await apiPatch(`/calidad2/infraestructura/auditorias/${id}/estado`, {
        estado: nuevoEstado,
      });
      toast.success('Estado actualizado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Subir documento a auditoría
   */
  const uploadDocumento = useCallback(async (auditoriaId, documentoData) => {
    try {
      const response = await apiPost(
        `/calidad2/infraestructura/auditorias/${auditoriaId}/documentos`,
        documentoData
      );
      toast.success('Documento subido exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al subir documento:', error);
      toast.error(error.response?.data?.message || 'Error al subir documento');
      return null;
    }
  }, []);

  /**
   * Eliminar documento de auditoría
   */
  const deleteDocumento = useCallback(async (documentoId) => {
    try {
      await apiDelete(`/calidad2/infraestructura/auditorias/documentos/${documentoId}`);
      toast.success('Documento eliminado exitosamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar documento');
      return false;
    }
  }, []);

  /**
   * Obtener auditorías próximas
   */
  const getProximas = useCallback(async (limit = 10) => {
    try {
      const response = await apiGet(
        `/calidad2/infraestructura/auditorias/proximas?limit=${limit}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener auditorías próximas:', error);
      toast.error(error.response?.data?.message || 'Error al obtener auditorías próximas');
      return [];
    }
  }, []);

  /**
   * Obtener estadísticas
   */
  const getEstadisticas = useCallback(async (anio) => {
    try {
      const url = anio
        ? `/calidad2/infraestructura/auditorias/estadisticas?anio=${anio}`
        : '/calidad2/infraestructura/auditorias/estadisticas';

      const response = await apiGet(url);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      toast.error(error.response?.data?.message || 'Error al obtener estadísticas');
      return null;
    }
  }, []);

  /**
   * Obtener años disponibles
   */
  const getAniosDisponibles = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/infraestructura/auditorias/anios-disponibles');
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener años disponibles:', error);
      return [];
    }
  }, []);

  /**
   * Obtener auditoría por ID
   */
  const getById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/infraestructura/auditorias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener auditoría:', error);
      toast.error(error.response?.data?.message || 'Error al obtener auditoría');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    auditorias,
    loading,
    loadAuditorias,
    createAuditoria,
    updateAuditoria,
    deleteAuditoria,
    cambiarEstado,
    uploadDocumento,
    deleteDocumento,
    getProximas,
    getEstadisticas,
    getAniosDisponibles,
    getById,
  };
}
