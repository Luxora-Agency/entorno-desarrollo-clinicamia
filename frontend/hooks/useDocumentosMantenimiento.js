import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

export function useDocumentosMantenimiento() {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const [uploading, setUploading] = useState(false);

  /**
   * Obtener todos los documentos con filtros
   */
  const loadDocumentos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const data = await apiGet('/calidad2/infraestructura/mantenimientos/documentos', filters);
      setDocumentos(data.documentos || []);
      return data;
    } catch (error) {
      toast.error('Error al cargar documentos');
      return { documentos: [], total: 0 };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener documentos de un mantenimiento específico
   */
  const loadDocumentosByMantenimiento = useCallback(async (mantenimientoId) => {
    try {
      setLoading(true);
      const data = await apiGet(`/calidad2/infraestructura/mantenimientos/mantenimientos/${mantenimientoId}/documentos`);
      setDocumentos(data || []);
      return data;
    } catch (error) {
      toast.error('Error al cargar documentos del mantenimiento');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear documento (con archivo)
   */
  const createDocumento = useCallback(async (mantenimientoId, documentoData) => {
    try {
      setUploading(true);
      const data = await apiPost(
        `/calidad2/infraestructura/mantenimientos/mantenimientos/${mantenimientoId}/documentos`,
        documentoData
      );
      toast.success('Documento subido exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al subir documento');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * Actualizar documento
   */
  const updateDocumento = useCallback(async (id, documentoData) => {
    try {
      setLoading(true);
      const data = await apiPut(`/calidad2/infraestructura/mantenimientos/documentos/${id}`, documentoData);
      toast.success('Documento actualizado exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al actualizar documento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar documento
   */
  const deleteDocumento = useCallback(async (id) => {
    try {
      setLoading(true);
      await apiDelete(`/calidad2/infraestructura/mantenimientos/documentos/${id}`);
      toast.success('Documento eliminado exitosamente');
      return true;
    } catch (error) {
      toast.error(error.message || 'Error al eliminar documento');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas de documentos
   */
  const loadEstadisticas = useCallback(async () => {
    try {
      const data = await apiGet('/calidad2/infraestructura/mantenimientos/documentos/stats');
      setEstadisticas(data);
      return data;
    } catch (error) {
      toast.error('Error al cargar estadísticas');
      return null;
    }
  }, []);

  /**
   * Upload de archivo (helper para manejar FormData)
   */
  const uploadDocumento = useCallback(async (mantenimientoId, file, metadata = {}) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('nombre', metadata.nombre || file.name);
      formData.append('tipoDocumento', metadata.tipoDocumento || 'OTRO');
      if (metadata.descripcion) {
        formData.append('descripcion', metadata.descripcion);
      }

      const data = await apiPost(
        `/calidad2/infraestructura/mantenimientos/mantenimientos/${mantenimientoId}/documentos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success('Archivo subido exitosamente');
      return data;
    } catch (error) {
      toast.error(error.message || 'Error al subir archivo');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    documentos,
    loading,
    uploading,
    estadisticas,
    loadDocumentos,
    loadDocumentosByMantenimiento,
    createDocumento,
    updateDocumento,
    deleteDocumento,
    loadEstadisticas,
    uploadDocumento,
  };
}
