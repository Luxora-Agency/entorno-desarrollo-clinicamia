'use client';

import { useState, useCallback, useRef } from 'react';
import { apiGet, apiPost, apiDelete, getAuthToken } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook para el Analizador de HCE con IA
 * Gestiona la subida de documentos, análisis y chat
 */
export default function useHCEAnalyzer() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [documentos, setDocumentos] = useState([]);
  const [documentoActual, setDocumentoActual] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [serviceStatus, setServiceStatus] = useState(null);
  const pollingRef = useRef(null);

  /**
   * Verificar estado del servicio
   */
  const checkStatus = useCallback(async () => {
    try {
      const response = await apiGet('/hce-analyzer/status');
      setServiceStatus(response.data);
      return response.data;
    } catch (error) {
      setServiceStatus({ configured: false });
      return { configured: false };
    }
  }, []);

  /**
   * Subir documento PDF
   * @param {File} file - Archivo PDF
   * @param {string|null} pacienteId - ID del paciente (opcional)
   */
  const uploadDocument = useCallback(async (file, pacienteId = null) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (pacienteId) {
        formData.append('pacienteId', pacienteId);
      }

      const token = getAuthToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const response = await fetch(`${apiUrl}/hce-analyzer/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al subir documento');
      }

      toast({
        title: 'Documento subido',
        description: 'El análisis se está procesando...'
      });

      return data.data;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
      throw error;
    } finally {
      setUploading(false);
    }
  }, [toast]);

  /**
   * Listar documentos del doctor
   * @param {object} filters - Filtros opcionales
   */
  const fetchDocumentos = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.pacienteId) params.append('pacienteId', filters.pacienteId);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const url = `/hce-analyzer/documentos${queryString ? `?${queryString}` : ''}`;

      const response = await apiGet(url);
      setDocumentos(response.data || []);
      return response;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los documentos'
      });
      return { data: [] };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Obtener documento con análisis completo
   * @param {string} id - ID del documento
   */
  const fetchDocumento = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await apiGet(`/hce-analyzer/documentos/${id}`);
      setDocumentoActual(response.data);
      setChatMessages(response.data?.conversaciones || []);
      return response.data;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el documento'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Chat sobre documento
   * @param {string} documentoId - ID del documento
   * @param {string} pregunta - Pregunta del usuario
   */
  const sendChatMessage = useCallback(async (documentoId, pregunta) => {
    // Agregar mensaje del usuario optimistamente
    const userMsg = {
      id: `temp-${Date.now()}`,
      rol: 'user',
      contenido: pregunta,
      createdAt: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const response = await apiPost(`/hce-analyzer/documentos/${documentoId}/chat`, {
        pregunta
      });

      // Agregar respuesta del asistente
      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        rol: 'assistant',
        contenido: response.data.respuesta,
        tokensUsados: response.data.tokensUsados,
        createdAt: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, assistantMsg]);

      return response.data;
    } catch (error) {
      // Remover mensaje del usuario en caso de error
      setChatMessages(prev => prev.filter(m => m.id !== userMsg.id));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo enviar el mensaje'
      });
      throw error;
    } finally {
      setChatLoading(false);
    }
  }, [toast]);

  /**
   * Eliminar documento
   * @param {string} id - ID del documento
   */
  const deleteDocumento = useCallback(async (id) => {
    try {
      await apiDelete(`/hce-analyzer/documentos/${id}`);
      setDocumentos(prev => prev.filter(d => d.id !== id));
      toast({
        title: 'Eliminado',
        description: 'Documento eliminado correctamente'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el documento'
      });
      throw error;
    }
  }, [toast]);

  /**
   * Re-analizar documento
   * @param {string} id - ID del documento
   */
  const reanalyzeDocumento = useCallback(async (id) => {
    try {
      await apiPost(`/hce-analyzer/documentos/${id}/reanalyze`);
      toast({
        title: 'Re-análisis iniciado',
        description: 'El documento está siendo analizado nuevamente'
      });
      // Actualizar documento en la lista
      setDocumentos(prev =>
        prev.map(d => d.id === id ? { ...d, estado: 'Procesando' } : d)
      );
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo re-analizar el documento'
      });
      throw error;
    }
  }, [toast]);

  /**
   * Obtener estadísticas
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await apiGet('/hce-analyzer/stats');
      setStats(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  }, []);

  /**
   * Polling para estado de análisis
   * @param {string} id - ID del documento
   * @param {function} onComplete - Callback cuando completa
   */
  const pollAnalysisStatus = useCallback((id, onComplete) => {
    // Limpiar polling anterior
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const checkStatus = async () => {
      try {
        const doc = await fetchDocumento(id);
        if (doc.estado === 'Completado' || doc.estado === 'Error') {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
          onComplete?.(doc);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    // Revisar cada 3 segundos
    pollingRef.current = setInterval(checkStatus, 3000);

    // Timeout después de 3 minutos
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }, 180000);

    // Primera verificación inmediata
    checkStatus();

    // Retornar función de cleanup
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchDocumento]);

  /**
   * Limpiar documento actual
   */
  const clearDocumentoActual = useCallback(() => {
    setDocumentoActual(null);
    setChatMessages([]);
  }, []);

  return {
    // Estado
    loading,
    uploading,
    chatLoading,
    documentos,
    documentoActual,
    chatMessages,
    stats,
    serviceStatus,

    // Acciones
    checkStatus,
    uploadDocument,
    fetchDocumentos,
    fetchDocumento,
    sendChatMessage,
    deleteDocumento,
    reanalyzeDocumento,
    fetchStats,
    pollAnalysisStatus,
    clearDocumentoActual,

    // Helpers
    isConfigured: serviceStatus?.configured ?? false
  };
}
