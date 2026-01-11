import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para gestión de Certificaciones de Historia Clínica
 * Control de vigencias, alertas de vencimiento y cumplimiento normativo
 */
export function useCalidad2CertificacionesHC() {
  const [certificaciones, setCertificaciones] = useState([]);
  const [certificacion, setCertificacion] = useState(null);
  const [vencimientos, setVencimientos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  /**
   * Cargar todas las certificaciones con filtros
   */
  const loadCertificaciones = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.responsable) params.append('responsable', filters.responsable);
      if (filters.search) params.append('search', filters.search);

      const response = await apiGet(`/calidad2/historia-clinica/certificaciones?${params.toString()}`);

      if (response.success) {
        setCertificaciones(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }

      return response;
    } catch (error) {
      console.error('Error al cargar certificaciones:', error);
      toast.error('Error al cargar certificaciones');
      setCertificaciones([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar certificación por ID
   */
  const loadCertificacion = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/historia-clinica/certificaciones/${id}`);

      if (response.success && response.data) {
        setCertificacion(response.data);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al cargar certificación:', error);
      toast.error('Error al cargar certificación');
      setCertificacion(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear nueva certificación
   */
  const createCertificacion = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/historia-clinica/certificaciones', data);

      if (response.success) {
        toast.success('Certificación creada exitosamente');
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al crear certificación:', error);
      toast.error(error.message || 'Error al crear certificación');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar certificación existente
   */
  const updateCertificacion = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/historia-clinica/certificaciones/${id}`, data);

      if (response.success) {
        toast.success('Certificación actualizada exitosamente');
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al actualizar certificación:', error);
      toast.error(error.message || 'Error al actualizar certificación');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar certificación (soft delete)
   */
  const deleteCertificacion = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiDelete(`/calidad2/historia-clinica/certificaciones/${id}`);

      if (response.success) {
        toast.success('Certificación eliminada correctamente');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al eliminar certificación:', error);
      toast.error(error.message || 'Error al eliminar certificación');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar certificaciones próximas a vencer
   */
  const loadVencimientos = useCallback(async (diasAnticipacion = 60) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/historia-clinica/certificaciones/vencimientos?dias=${diasAnticipacion}`);

      if (response.success && response.data) {
        setVencimientos(response.data || []);
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error al cargar vencimientos:', error);
      toast.error('Error al cargar certificaciones próximas a vencer');
      setVencimientos([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar estadísticas de certificaciones
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/historia-clinica/certificaciones/stats');

      if (response.success && response.data) {
        setStats(response.data);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas de certificaciones');
      setStats(null);
      return null;
    }
  }, []);

  /**
   * Verificar y generar alertas de vencimiento (trigger manual)
   */
  const checkAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/historia-clinica/certificaciones/check-alerts');

      if (response.success && response.data) {
        const { alertasGeneradas, detalles } = response.data;

        if (alertasGeneradas > 0) {
          toast.success(`Se generaron ${alertasGeneradas} alertas de vencimiento`);
        } else {
          toast.info('No hay certificaciones próximas a vencer');
        }

        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al verificar alertas:', error);
      toast.error('Error al verificar alertas de vencimiento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reiniciar certificación seleccionada
   */
  const clearCertificacion = useCallback(() => {
    setCertificacion(null);
  }, []);

  /**
   * Reiniciar lista de certificaciones
   */
  const clearCertificaciones = useCallback(() => {
    setCertificaciones([]);
    setPagination({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  }, []);

  return {
    // Estado
    certificaciones,
    certificacion,
    vencimientos,
    stats,
    loading,
    pagination,

    // Métodos CRUD
    loadCertificaciones,
    loadCertificacion,
    createCertificacion,
    updateCertificacion,
    deleteCertificacion,

    // Métodos especiales
    loadVencimientos,
    loadStats,
    checkAlerts,

    // Utilidades
    clearCertificacion,
    clearCertificaciones,
  };
}
