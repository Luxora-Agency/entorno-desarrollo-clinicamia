import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCalidad2Protocolos() {
  const [protocolos, setProtocolos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const loadProtocolos = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/protocolos', params);
      setProtocolos(Array.isArray(response.data) ? response.data : []);
      return response;
    } catch (error) {
      console.error('Error loading protocolos:', error);
      setProtocolos([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los protocolos.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getProtocolo = useCallback(async (id) => {
    try {
      const response = await apiGet(`/calidad2/medicamentos/protocolos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting protocolo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el protocolo.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const getVigentes = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/medicamentos/protocolos/vigentes');
      return response.data;
    } catch (error) {
      console.error('Error getting protocolos vigentes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los protocolos vigentes.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const getProximasRevisiones = useCallback(async (dias = 30) => {
    try {
      const response = await apiGet('/calidad2/medicamentos/protocolos/proximas-revisiones', { dias });
      return response.data;
    } catch (error) {
      console.error('Error getting próximas revisiones:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las próximas revisiones.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const createProtocolo = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/medicamentos/protocolos', data);

      if (response.data) {
        setProtocolos(prev => [response.data, ...prev]);
      }

      toast({
        title: 'Protocolo creado',
        description: 'El protocolo se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error creating protocolo:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el protocolo.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateProtocolo = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/medicamentos/protocolos/${id}`, data);

      if (response.data) {
        setProtocolos(prev =>
          prev.map(protocolo => protocolo.id === id ? response.data : protocolo)
        );
      }

      toast({
        title: 'Protocolo actualizado',
        description: 'El protocolo se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error updating protocolo:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el protocolo.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const deleteProtocolo = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/medicamentos/protocolos/${id}`);

      setProtocolos(prev => prev.filter(protocolo => protocolo.id !== id));

      toast({
        title: 'Protocolo eliminado',
        description: 'El protocolo se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return true;
    } catch (error) {
      console.error('Error deleting protocolo:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el protocolo.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const aprobarProtocolo = useCallback(async (id) => {
    try {
      const response = await apiPost(`/calidad2/medicamentos/protocolos/${id}/aprobar`, {});

      if (response.data) {
        setProtocolos(prev =>
          prev.map(protocolo => protocolo.id === id ? response.data : protocolo)
        );
      }

      toast({
        title: 'Protocolo aprobado',
        description: 'El protocolo ha sido aprobado y está vigente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error aprobando protocolo:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aprobar el protocolo.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const uploadDocumento = useCallback(async (protocoloId, file, metadata = {}) => {
    try {
      setUploading(true);

      // Aquí deberías usar tu servicio de upload de archivos
      // Por ahora, solo simulo la estructura
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nombre', metadata.nombre || file.name);
      formData.append('version', metadata.version || '1.0');
      formData.append('esPrincipal', metadata.esPrincipal || false);

      // Este endpoint necesitaría ser implementado para manejar multipart/form-data
      const response = await apiPost(`/calidad2/medicamentos/protocolos/${protocoloId}/documentos`, formData);

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

  const deleteDocumento = useCallback(async (documentoId) => {
    try {
      await apiDelete(`/calidad2/medicamentos/protocolos/documentos/${documentoId}`);

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

  return {
    protocolos,
    loading,
    uploading,
    loadProtocolos,
    getProtocolo,
    getVigentes,
    getProximasRevisiones,
    createProtocolo,
    updateProtocolo,
    deleteProtocolo,
    aprobarProtocolo,
    uploadDocumento,
    deleteDocumento,
  };
}
