'use client';

import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para gestión de Documentos Normativos de Historia Clínica
 *
 * Endpoints:
 * - GET    /calidad2/historia-clinica/documentos
 * - GET    /calidad2/historia-clinica/documentos/stats
 * - GET    /calidad2/historia-clinica/documentos/:id
 * - POST   /calidad2/historia-clinica/documentos
 * - PUT    /calidad2/historia-clinica/documentos/:id
 * - DELETE /calidad2/historia-clinica/documentos/:id
 * - POST   /calidad2/historia-clinica/documentos/:id/aprobar
 * - POST   /calidad2/historia-clinica/documentos/:id/distribuir
 * - POST   /calidad2/historia-clinica/documentos/:id/versiones
 * - GET    /calidad2/historia-clinica/documentos/:id/versiones
 * - POST   /calidad2/historia-clinica/documentos/:id/confirmar-lectura
 */
export function useCalidad2DocumentosHC() {
  const [documentos, setDocumentos] = useState([]);
  const [documento, setDocumento] = useState(null);
  const [versiones, setVersiones] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  /**
   * Obtener todos los documentos con filtros
   * @param {Object} filters - { page, limit, tipo, categoria, estado, search }
   */
  const fetchDocumentos = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 20,
        ...(filters.tipo && { tipo: filters.tipo }),
        ...(filters.categoria && { categoria: filters.categoria }),
        ...(filters.estado && { estado: filters.estado }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await apiGet(`/calidad2/historia-clinica/documentos?${params}`);

      if (response.success) {
        setDocumentos(response.data || []);
        setPagination(response.pagination);
      }

      return response;
    } catch (error) {
      console.error('Error fetching documentos:', error);
      toast.error('Error al cargar documentos');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener documento por ID
   */
  const fetchDocumento = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await apiGet(`/calidad2/historia-clinica/documentos/${id}`);

      if (response.success) {
        setDocumento(response.data);
      }

      return response;
    } catch (error) {
      console.error('Error fetching documento:', error);
      toast.error('Error al cargar documento');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas de documentos
   */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGet('/calidad2/historia-clinica/documentos/stats');

      if (response.success) {
        setStats(response.data);
      }

      return response;
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error al cargar estadísticas');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear nuevo documento
   * @param {Object} data - { codigo, nombre, tipo, categoria, archivoUrl, elaboradoPor, ... }
   */
  const createDocumento = useCallback(async (data) => {
    setLoading(true);
    try {
      const response = await apiPost('/calidad2/historia-clinica/documentos', data);

      if (response.success) {
        toast.success(response.message || 'Documento creado exitosamente');
        // Actualizar lista de documentos
        await fetchDocumentos({ page: 1 });
      } else {
        toast.error(response.message || 'Error al crear documento');
      }

      return response;
    } catch (error) {
      console.error('Error creating documento:', error);
      toast.error('Error al crear documento');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [fetchDocumentos]);

  /**
   * Actualizar documento
   */
  const updateDocumento = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await apiPut(`/calidad2/historia-clinica/documentos/${id}`, data);

      if (response.success) {
        toast.success(response.message || 'Documento actualizado');
        setDocumento(response.data);
        // Actualizar en lista
        setDocumentos(prev =>
          prev.map(doc => doc.id === id ? response.data : doc)
        );
      } else {
        toast.error(response.message || 'Error al actualizar documento');
      }

      return response;
    } catch (error) {
      console.error('Error updating documento:', error);
      toast.error('Error al actualizar documento');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar documento (soft delete)
   */
  const deleteDocumento = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await apiDelete(`/calidad2/historia-clinica/documentos/${id}`);

      if (response.success) {
        toast.success(response.message || 'Documento eliminado');
        // Remover de lista
        setDocumentos(prev => prev.filter(doc => doc.id !== id));
      } else {
        toast.error(response.message || 'Error al eliminar documento');
      }

      return response;
    } catch (error) {
      console.error('Error deleting documento:', error);
      toast.error('Error al eliminar documento');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Aprobar documento (revisar o aprobar)
   * @param {string} id - ID del documento
   * @param {string} aprobadoPor - ID del usuario que aprueba
   * @param {string} tipo - 'revisar' o 'aprobar'
   */
  const aprobarDocumento = useCallback(async (id, aprobadoPor, tipo = 'revisar') => {
    setLoading(true);
    try {
      const response = await apiPost(
        `/calidad2/historia-clinica/documentos/${id}/aprobar`,
        { aprobadoPor, tipo }
      );

      if (response.success) {
        toast.success(response.message || `Documento ${tipo === 'revisar' ? 'revisado' : 'aprobado'}`);
        setDocumento(response.data);
        // Actualizar en lista
        setDocumentos(prev =>
          prev.map(doc => doc.id === id ? response.data : doc)
        );
      } else {
        toast.error(response.message || 'Error al aprobar documento');
      }

      return response;
    } catch (error) {
      console.error('Error approving documento:', error);
      toast.error('Error al aprobar documento');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Distribuir documento a usuarios
   * @param {string} id - ID del documento
   * @param {string[]} usuariosIds - Array de IDs de usuarios
   */
  const distribuirDocumento = useCallback(async (id, usuariosIds) => {
    setLoading(true);
    try {
      const response = await apiPost(
        `/calidad2/historia-clinica/documentos/${id}/distribuir`,
        { usuariosIds }
      );

      if (response.success) {
        toast.success(response.data?.message || 'Documento distribuido exitosamente');
      } else {
        toast.error(response.message || 'Error al distribuir documento');
      }

      return response;
    } catch (error) {
      console.error('Error distributing documento:', error);
      toast.error('Error al distribuir documento');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear nueva versión de documento
   * @param {string} id - ID del documento
   * @param {Object} versionData - { version, cambiosRealizados, archivoUrl, creadoPor }
   */
  const crearVersion = useCallback(async (id, versionData) => {
    setLoading(true);
    try {
      const response = await apiPost(
        `/calidad2/historia-clinica/documentos/${id}/versiones`,
        versionData
      );

      if (response.success) {
        toast.success(response.message || 'Nueva versión creada');
        // Actualizar lista de versiones si está cargada
        setVersiones(prev => [response.data, ...prev]);
      } else {
        toast.error(response.message || 'Error al crear versión');
      }

      return response;
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error('Error al crear versión');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener versiones de un documento
   */
  const fetchVersiones = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await apiGet(`/calidad2/historia-clinica/documentos/${id}/versiones`);

      if (response.success) {
        setVersiones(response.data || []);
      }

      return response;
    } catch (error) {
      console.error('Error fetching versiones:', error);
      toast.error('Error al cargar versiones');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Confirmar lectura de documento distribuido
   * @param {string} documentoId - ID del documento
   * @param {string} usuarioId - ID del usuario que confirma
   */
  const confirmarLectura = useCallback(async (documentoId, usuarioId) => {
    setLoading(true);
    try {
      const response = await apiPost(
        `/calidad2/historia-clinica/documentos/${documentoId}/confirmar-lectura`,
        { usuarioId }
      );

      if (response.success) {
        toast.success(response.message || 'Lectura confirmada');
      } else {
        toast.error(response.message || 'Error al confirmar lectura');
      }

      return response;
    } catch (error) {
      console.error('Error confirming lectura:', error);
      toast.error('Error al confirmar lectura');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    documentos,
    documento,
    versiones,
    stats,
    loading,
    pagination,

    // Actions
    fetchDocumentos,
    fetchDocumento,
    fetchStats,
    createDocumento,
    updateDocumento,
    deleteDocumento,
    aprobarDocumento,
    distribuirDocumento,
    crearVersion,
    fetchVersiones,
    confirmarLectura,

    // Helpers
    setDocumento,
    setDocumentos,
  };
}
