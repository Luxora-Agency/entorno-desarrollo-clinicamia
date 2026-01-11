import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export function useCalidad2Farmacovigilancia() {
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [estadisticas, setEstadisticas] = useState(null);
  const { toast } = useToast();

  /**
   * Load farmacovigilancia reports
   */
  const loadReportes = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const response = await apiGet('/calidad2/medicamentos/farmacovigilancia', params);
      setReportes(Array.isArray(response.data) ? response.data : []);
      return response;
    } catch (error) {
      console.error('Error loading reportes:', error);
      setReportes([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes de farmacovigilancia.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Get a single report by ID
   */
  const getReporte = useCallback(async (id) => {
    try {
      const response = await apiGet(`/calidad2/medicamentos/farmacovigilancia/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting reporte:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el reporte.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Get statistics
   */
  const getEstadisticas = useCallback(async (filters = {}) => {
    try {
      const response = await apiGet('/calidad2/medicamentos/farmacovigilancia/estadisticas', filters);
      setEstadisticas(response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting estadísticas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Get reports pending INVIMA submission
   */
  const getPendientesINVIMA = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/medicamentos/farmacovigilancia/pendientes-invima');
      return response.data;
    } catch (error) {
      console.error('Error getting pendientes INVIMA:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los reportes pendientes.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  /**
   * Create a new report
   */
  const createReporte = useCallback(async (data) => {
    try {
      const response = await apiPost('/calidad2/medicamentos/farmacovigilancia', data);

      if (response.data) {
        setReportes(prev => [response.data, ...prev]);
      }

      toast({
        title: 'Reporte creado',
        description: 'El reporte de farmacovigilancia se ha creado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error creating reporte:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el reporte.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Update a report
   */
  const updateReporte = useCallback(async (id, data) => {
    try {
      const response = await apiPut(`/calidad2/medicamentos/farmacovigilancia/${id}`, data);

      if (response.data) {
        setReportes(prev =>
          prev.map(reporte => reporte.id === id ? response.data : reporte)
        );
      }

      toast({
        title: 'Reporte actualizado',
        description: 'El reporte se ha actualizado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error updating reporte:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el reporte.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Delete a report
   */
  const deleteReporte = useCallback(async (id) => {
    try {
      await apiDelete(`/calidad2/medicamentos/farmacovigilancia/${id}`);

      setReportes(prev => prev.filter(reporte => reporte.id !== id));

      toast({
        title: 'Reporte eliminado',
        description: 'El reporte se ha eliminado correctamente.',
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return true;
    } catch (error) {
      console.error('Error deleting reporte:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el reporte.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  /**
   * Report to INVIMA
   */
  const reportarINVIMA = useCallback(async (id, numeroReporte) => {
    try {
      const response = await apiPost(`/calidad2/medicamentos/farmacovigilancia/${id}/reportar-invima`, {
        numeroReporteINVIMA: numeroReporte,
      });

      if (response.data) {
        setReportes(prev =>
          prev.map(reporte => reporte.id === id ? response.data : reporte)
        );
      }

      toast({
        title: 'Reporte enviado a INVIMA',
        description: `El reporte ha sido marcado como enviado a INVIMA con número ${numeroReporte}.`,
        className: 'bg-green-50 border-green-200 text-green-800',
      });

      return response.data;
    } catch (error) {
      console.error('Error reportando a INVIMA:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo reportar a INVIMA.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  /**
   * Upload document to report
   */
  const uploadDocumento = useCallback(async (reporteId, file, metadata = {}) => {
    try {
      setUploading(true);

      // This would use your file upload service
      // For now, placeholder structure
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nombre', metadata.nombre || file.name);

      // Placeholder - would need multipart endpoint
      const response = await apiPost(`/calidad2/medicamentos/farmacovigilancia/${reporteId}/documentos`, {
        file: { name: file.name, type: file.type, size: file.size },
        metadata,
      });

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

  /**
   * Delete document from report
   */
  const deleteDocumento = useCallback(async (documentoId) => {
    try {
      await apiDelete(`/calidad2/medicamentos/farmacovigilancia/documentos/${documentoId}`);

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
    reportes,
    loading,
    uploading,
    estadisticas,
    loadReportes,
    getReporte,
    getEstadisticas,
    getPendientesINVIMA,
    createReporte,
    updateReporte,
    deleteReporte,
    reportarINVIMA,
    uploadDocumento,
    deleteDocumento,
  };
}
