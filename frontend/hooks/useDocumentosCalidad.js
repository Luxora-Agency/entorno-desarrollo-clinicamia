/**
 * Hook para gestión de Documentos de Calidad
 * Sistema de Gestión Documental - Control de versiones
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const useDocumentosCalidad = () => {
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // DOCUMENTOS - CRUD
  // ==========================================

  const fetchDocumentos = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad', { limit: 100, ...params });
      setDocumentos(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentoById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/documentos-calidad/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getDocumentoByCodigo = useCallback(async (codigo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad', { codigo });
      return { success: true, data: response.data?.[0] || null };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createDocumento = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/documentos-calidad', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDocumento = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/documentos-calidad/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocumento = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      await apiDelete(`/documentos-calidad/${id}`);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // FILTROS Y BÚSQUEDAS
  // ==========================================

  const fetchDocumentosPorTipo = useCallback(async (tipo, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad', { tipo, ...params });
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocumentosPorEstado = useCallback(async (estado, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad', { estado, ...params });
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocumentosVigentes = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad', { estado: 'VIGENTE', ...params });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarDocumentos = useCallback(async (termino, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad/buscar', { q: termino, ...params });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // FLUJO DE APROBACIÓN
  // ==========================================

  const enviarARevision = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/documentos-calidad/${id}/enviar-revision`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const revisarDocumento = useCallback(async (id, aprobado, observaciones) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/documentos-calidad/${id}/revisar`, { aprobado, observaciones });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const aprobarDocumento = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/documentos-calidad/${id}/aprobar`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const publicarDocumento = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/documentos-calidad/${id}/publicar`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const obsoletarDocumento = useCallback(async (id, motivo) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/documentos-calidad/${id}/obsoletar`, { motivo });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // CONTROL DE VERSIONES
  // ==========================================

  const getHistorialVersiones = useCallback(async (documentoId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/documentos-calidad/${documentoId}/versiones`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const crearNuevaVersion = useCallback(async (documentoId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/documentos-calidad/${documentoId}/versiones`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getVersionAnterior = useCallback(async (documentoId, version) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/documentos-calidad/${documentoId}/versiones/${version}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // SOCIALIZACIÓN
  // ==========================================

  const getSocializaciones = useCallback(async (documentoId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/documentos-calidad/${documentoId}/socializaciones`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const registrarSocializacion = useCallback(async (documentoId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/documentos-calidad/${documentoId}/socializaciones`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // ALERTAS Y VENCIMIENTOS
  // ==========================================

  const fetchDocumentosPorRevisar = useCallback(async (dias = 30) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad/alertas/por-revisar', { dias });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocumentosPendientesAprobacion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad', { estado: 'EN_REVISION' });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // LISTA MAESTRA
  // ==========================================

  const getListaMaestra = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad/lista-maestra', params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const exportarListaMaestra = useCallback(async (formato = 'excel') => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad/lista-maestra/exportar', { formato });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // DASHBOARD
  // ==========================================

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad/dashboard');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasPorTipo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad/estadisticas/por-tipo');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasPorEstado = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/documentos-calidad/estadisticas/por-estado');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estado
    documentos,
    loading,
    error,
    // CRUD
    fetchDocumentos,
    getDocumentoById,
    getDocumentoByCodigo,
    createDocumento,
    updateDocumento,
    deleteDocumento,
    // Filtros
    fetchDocumentosPorTipo,
    fetchDocumentosPorEstado,
    fetchDocumentosVigentes,
    buscarDocumentos,
    // Flujo aprobación
    enviarARevision,
    revisarDocumento,
    aprobarDocumento,
    publicarDocumento,
    obsoletarDocumento,
    // Versiones
    getHistorialVersiones,
    crearNuevaVersion,
    getVersionAnterior,
    // Socialización
    getSocializaciones,
    registrarSocializacion,
    // Alertas
    fetchDocumentosPorRevisar,
    fetchDocumentosPendientesAprobacion,
    // Lista maestra
    getListaMaestra,
    exportarListaMaestra,
    // Dashboard
    fetchDashboard,
    getEstadisticasPorTipo,
    getEstadisticasPorEstado,
  };
};
