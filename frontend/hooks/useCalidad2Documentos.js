import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCalidad2Documentos(carpetaId = null, tipo = null) {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastParams, setLastParams] = useState({});
  const { toast } = useToast();

  const loadDocumentos = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        ...(carpetaId !== undefined && { carpetaId }),
        ...(tipo && { tipo }),
        ...params,
      };
      // Guardar los últimos parámetros usados para recargas posteriores
      setLastParams(queryParams);

      const response = await apiGet('/calidad2/documentos', queryParams);
      const docs = Array.isArray(response.data) ? response.data : [];

      // Filtrado defensivo: solo documentos que coincidan con los parámetros de búsqueda
      const filtered = docs.filter(doc => {
        // Si se especificó carpetaId en queryParams, verificar coincidencia exacta (incluyendo null)
        if ('carpetaId' in queryParams) {
          // Normalizar null y undefined a null para comparación
          const paramCarpetaId = queryParams.carpetaId === undefined ? null : queryParams.carpetaId;
          const docCarpetaId = doc.carpetaId === undefined ? null : doc.carpetaId;
          if (paramCarpetaId !== docCarpetaId) return false;
        }
        // Si se especificó tipo, verificar coincidencia
        if (queryParams.tipo && doc.tipo !== queryParams.tipo) return false;
        return true;
      });

      setDocumentos(filtered);
    } catch (error) {
      console.error('Error loading documentos:', error);
      setDocumentos([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los documentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [carpetaId, tipo, toast]);

  const uploadDocumento = useCallback(async (file, metadata = {}) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (metadata.nombre) formData.append('nombre', metadata.nombre);
      if (metadata.descripcion) formData.append('descripcion', metadata.descripcion);

      // Agregar carpetaId y tipo aunque sean null/undefined
      formData.append('carpetaId', metadata.carpetaId || '');
      formData.append('tipo', metadata.tipo || '');

      const response = await apiPost('/calidad2/documentos', formData);

      // Agregar el documento a la lista local inmediatamente
      if (response.data) {
        setDocumentos(prev => [response.data, ...prev]);
      }

      toast({
        title: 'Documento subido',
        description: 'El documento se ha subido correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading documento:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo subir el documento.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const updateDocumento = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/documentos/${id}`, data);

      // Actualizar la lista local inmediatamente
      if (response.data) {
        setDocumentos(prev =>
          prev.map(doc => doc.id === id ? response.data : doc)
        );
      }

      toast({
        title: 'Documento actualizado',
        description: 'El documento se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error updating documento:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el documento.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const deleteDocumento = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/documentos/${id}`);

      // Actualizar la lista local inmediatamente
      setDocumentos(prev => prev.filter(doc => doc.id !== id));

      toast({
        title: 'Documento eliminado',
        description: 'El documento se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return true;
    } catch (error) {
      console.error('Error deleting documento:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el documento.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const moverDocumento = useCallback(async (id, carpetaId) => {
    try {
      const response = await apiPut(`/calidad2/documentos/${id}/mover`, { carpetaId });

      // Actualizar la lista local inmediatamente
      if (response.data) {
        setDocumentos(prev =>
          prev.map(doc => doc.id === id ? response.data : doc)
        );
      }

      toast({
        title: 'Documento movido',
        description: 'El documento se ha movido correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error moving documento:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo mover el documento.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  return {
    documentos,
    loading,
    uploading,
    loadDocumentos,
    uploadDocumento,
    updateDocumento,
    deleteDocumento,
    moverDocumento,
  };
}
