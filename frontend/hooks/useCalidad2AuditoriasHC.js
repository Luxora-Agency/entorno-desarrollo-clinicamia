import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para gestión de Auditorías de Historia Clínica
 *
 * Gestiona:
 * - CRUD de auditorías HC
 * - Gestión de hallazgos por auditoría
 * - Cierre de auditorías
 * - Estadísticas y reportes
 */
export function useCalidad2AuditoriasHC() {
  // Estado para auditorías
  const [auditorias, setAuditorias] = useState([]);
  const [auditoria, setAuditoria] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Estado para hallazgos
  const [hallazgos, setHallazgos] = useState([]);
  const [loadingHallazgos, setLoadingHallazgos] = useState(false);

  // Estado para estadísticas
  const [stats, setStats] = useState(null);

  // ==========================================
  // AUDITORÍAS
  // ==========================================

  /**
   * Cargar todas las auditorías con filtros
   */
  const loadAuditorias = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const data = await apiGet('/calidad2/historia-clinica/auditorias', filters);

      if (data.success) {
        setAuditorias(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }

      return data;
    } catch (error) {
      console.error('Error cargando auditorías:', error);
      toast.error('Error al cargar auditorías');
      setAuditorias([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar una auditoría por ID
   */
  const loadAuditoria = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await apiGet(`/calidad2/historia-clinica/auditorias/${id}`);

      if (data.success && data.data) {
        setAuditoria(data.data);
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Error cargando auditoría:', error);
      toast.error('Error al cargar auditoría');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear nueva auditoría
   */
  const createAuditoria = useCallback(async (auditoriaData) => {
    setLoading(true);
    try {
      const data = await apiPost('/calidad2/historia-clinica/auditorias', auditoriaData);

      if (data.success) {
        toast.success(data.message || 'Auditoría creada exitosamente');
        return true;
      }

      toast.error(data.message || 'Error al crear auditoría');
      return false;
    } catch (error) {
      console.error('Error creando auditoría:', error);
      toast.error('Error al crear auditoría');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar auditoría existente
   */
  const updateAuditoria = useCallback(async (id, auditoriaData) => {
    setLoading(true);
    try {
      const data = await apiPut(`/calidad2/historia-clinica/auditorias/${id}`, auditoriaData);

      if (data.success) {
        toast.success(data.message || 'Auditoría actualizada exitosamente');
        return true;
      }

      toast.error(data.message || 'Error al actualizar auditoría');
      return false;
    } catch (error) {
      console.error('Error actualizando auditoría:', error);
      toast.error('Error al actualizar auditoría');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar auditoría (soft delete)
   */
  const deleteAuditoria = useCallback(async (id) => {
    setLoading(true);
    try {
      const data = await apiDelete(`/calidad2/historia-clinica/auditorias/${id}`);

      if (data.success) {
        toast.success(data.message || 'Auditoría eliminada exitosamente');
        return true;
      }

      toast.error(data.message || 'Error al eliminar auditoría');
      return false;
    } catch (error) {
      console.error('Error eliminando auditoría:', error);
      toast.error('Error al eliminar auditoría');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cerrar auditoría
   */
  const cerrarAuditoria = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const response = await apiPost(`/calidad2/historia-clinica/auditorias/${id}/cerrar`, data);

      if (response.success) {
        toast.success(response.message || 'Auditoría cerrada exitosamente');
        return true;
      }

      toast.error(response.message || 'Error al cerrar auditoría');
      return false;
    } catch (error) {
      console.error('Error cerrando auditoría:', error);
      toast.error(error.message || 'Error al cerrar auditoría');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener estadísticas de auditorías
   */
  const loadStats = useCallback(async (filters = {}) => {
    try {
      const data = await apiGet('/calidad2/historia-clinica/auditorias/stats', filters);

      if (data.success && data.data) {
        setStats(data.data);
        return data.data;
      }

      return null;
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      return null;
    }
  }, []);

  // ==========================================
  // HALLAZGOS
  // ==========================================

  /**
   * Crear hallazgo en una auditoría
   */
  const createHallazgo = useCallback(async (auditoriaId, hallazgoData) => {
    setLoadingHallazgos(true);
    try {
      const data = await apiPost(
        `/calidad2/historia-clinica/auditorias/${auditoriaId}/hallazgos`,
        hallazgoData
      );

      if (data.success) {
        toast.success(data.message || 'Hallazgo creado exitosamente');
        return true;
      }

      toast.error(data.message || 'Error al crear hallazgo');
      return false;
    } catch (error) {
      console.error('Error creando hallazgo:', error);
      toast.error('Error al crear hallazgo');
      return false;
    } finally {
      setLoadingHallazgos(false);
    }
  }, []);

  /**
   * Cargar hallazgos de una auditoría
   */
  const loadHallazgos = useCallback(async (auditoriaId, filters = {}) => {
    setLoadingHallazgos(true);
    try {
      const data = await apiGet(
        `/calidad2/historia-clinica/auditorias/${auditoriaId}/hallazgos`,
        filters
      );

      if (data.success && data.data) {
        setHallazgos(data.data || []);
        return data.data;
      }

      setHallazgos([]);
      return [];
    } catch (error) {
      console.error('Error cargando hallazgos:', error);
      toast.error('Error al cargar hallazgos');
      setHallazgos([]);
      return [];
    } finally {
      setLoadingHallazgos(false);
    }
  }, []);

  /**
   * Actualizar hallazgo
   */
  const updateHallazgo = useCallback(async (hallazgoId, hallazgoData) => {
    setLoadingHallazgos(true);
    try {
      const data = await apiPut(
        `/calidad2/historia-clinica/auditorias/hallazgos/${hallazgoId}`,
        hallazgoData
      );

      if (data.success) {
        toast.success(data.message || 'Hallazgo actualizado exitosamente');
        return true;
      }

      toast.error(data.message || 'Error al actualizar hallazgo');
      return false;
    } catch (error) {
      console.error('Error actualizando hallazgo:', error);
      toast.error('Error al actualizar hallazgo');
      return false;
    } finally {
      setLoadingHallazgos(false);
    }
  }, []);

  return {
    // Estado
    auditorias,
    auditoria,
    loading,
    pagination,
    hallazgos,
    loadingHallazgos,
    stats,

    // Métodos de auditorías
    loadAuditorias,
    loadAuditoria,
    createAuditoria,
    updateAuditoria,
    deleteAuditoria,
    cerrarAuditoria,
    loadStats,

    // Métodos de hallazgos
    createHallazgo,
    loadHallazgos,
    updateHallazgo
  };
}
