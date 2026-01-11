import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para gestión de Consentimientos Informados de Historia Clínica
 * Maneja tipos (plantillas) y consentimientos aplicados con firmas digitales
 */
export function useCalidad2ConsentimientosHC() {
  // Estado para tipos (plantillas)
  const [tipos, setTipos] = useState([]);
  const [tipo, setTipo] = useState(null);
  const [statsTipos, setStatsTipos] = useState(null);

  // Estado para aplicados
  const [aplicados, setAplicados] = useState([]);
  const [aplicado, setAplicado] = useState(null);
  const [statsAplicados, setStatsAplicados] = useState(null);

  // Estado general
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // ==========================================
  // TIPOS DE CONSENTIMIENTO (Plantillas)
  // ==========================================

  /**
   * Cargar todos los tipos con filtros
   */
  const loadTipos = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.servicio) params.append('servicio', filters.servicio);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.search) params.append('search', filters.search);

      const response = await apiGet(`/calidad2/historia-clinica/consentimientos/tipos?${params.toString()}`);

      if (response.success) {
        setTipos(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }

      return response;
    } catch (error) {
      console.error('Error al cargar tipos:', error);
      toast.error('Error al cargar tipos de consentimiento');
      setTipos([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar tipo por ID
   */
  const loadTipo = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/historia-clinica/consentimientos/tipos/${id}`);

      if (response.success && response.data) {
        setTipo(response.data);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al cargar tipo:', error);
      toast.error('Error al cargar tipo de consentimiento');
      setTipo(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar tipos por servicio
   */
  const loadTiposByServicio = useCallback(async (servicio) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/historia-clinica/consentimientos/tipos/servicio/${servicio}`);

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error al cargar tipos por servicio:', error);
      toast.error(`Error al cargar tipos de ${servicio}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crear nuevo tipo
   */
  const createTipo = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/historia-clinica/consentimientos/tipos', data);

      if (response.success) {
        toast.success('Tipo de consentimiento creado exitosamente');
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al crear tipo:', error);
      toast.error(error.message || 'Error al crear tipo de consentimiento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar tipo
   */
  const updateTipo = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const response = await apiPut(`/calidad2/historia-clinica/consentimientos/tipos/${id}`, data);

      if (response.success) {
        toast.success('Tipo de consentimiento actualizado exitosamente');
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al actualizar tipo:', error);
      toast.error(error.message || 'Error al actualizar tipo de consentimiento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar tipo (soft delete)
   */
  const deleteTipo = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiDelete(`/calidad2/historia-clinica/consentimientos/tipos/${id}`);

      if (response.success) {
        toast.success('Tipo de consentimiento eliminado correctamente');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al eliminar tipo:', error);
      toast.error(error.message || 'Error al eliminar tipo de consentimiento');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar estadísticas de tipos
   */
  const loadStatsTipos = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/historia-clinica/consentimientos/tipos/stats');

      if (response.success && response.data) {
        setStatsTipos(response.data);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas de tipos');
      setStatsTipos(null);
      return null;
    }
  }, []);

  // ==========================================
  // CONSENTIMIENTOS APLICADOS
  // ==========================================

  /**
   * Aplicar consentimiento a paciente
   */
  const aplicar = useCallback(async (data) => {
    try {
      setLoading(true);
      const response = await apiPost('/calidad2/historia-clinica/consentimientos/aplicar', data);

      if (response.success) {
        toast.success('Consentimiento aplicado exitosamente');
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al aplicar consentimiento:', error);
      toast.error(error.message || 'Error al aplicar consentimiento');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar todos los consentimientos aplicados con filtros
   */
  const loadAplicados = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.pacienteId) params.append('pacienteId', filters.pacienteId);
      if (filters.medicoId) params.append('medicoId', filters.medicoId);
      if (filters.tipoId) params.append('tipoId', filters.tipoId);
      if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);

      const response = await apiGet(`/calidad2/historia-clinica/consentimientos/aplicados?${params.toString()}`);

      if (response.success) {
        setAplicados(response.data || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }

      return response;
    } catch (error) {
      console.error('Error al cargar aplicados:', error);
      toast.error('Error al cargar consentimientos aplicados');
      setAplicados([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar consentimiento aplicado por ID
   */
  const loadAplicado = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/historia-clinica/consentimientos/aplicados/${id}`);

      if (response.success && response.data) {
        setAplicado(response.data);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al cargar aplicado:', error);
      toast.error('Error al cargar consentimiento aplicado');
      setAplicado(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar consentimientos de un paciente
   */
  const loadByPaciente = useCallback(async (pacienteId) => {
    try {
      setLoading(true);
      const response = await apiGet(`/calidad2/historia-clinica/consentimientos/aplicados/paciente/${pacienteId}`);

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Error al cargar consentimientos del paciente:', error);
      toast.error('Error al cargar consentimientos del paciente');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registrar firma
   */
  const registrarFirma = useCallback(async (id, tipoFirma, firmaBase64) => {
    try {
      setLoading(true);
      const response = await apiPost(`/calidad2/historia-clinica/consentimientos/aplicados/${id}/firma`, {
        tipoFirma,
        firmaBase64,
      });

      if (response.success) {
        toast.success('Firma registrada exitosamente');
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al registrar firma:', error);
      toast.error(error.message || 'Error al registrar firma');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cargar estadísticas de aplicados
   */
  const loadStatsAplicados = useCallback(async () => {
    try {
      const response = await apiGet('/calidad2/historia-clinica/consentimientos/aplicados/stats');

      if (response.success && response.data) {
        setStatsAplicados(response.data);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar estadísticas de consentimientos aplicados');
      setStatsAplicados(null);
      return null;
    }
  }, []);

  /**
   * Generar PDF
   */
  const generarPDF = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await apiPost(`/calidad2/historia-clinica/consentimientos/aplicados/${id}/pdf`);

      if (response.success) {
        toast.info(response.message || 'PDF generado');
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar PDF');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Utilidades
   */
  const clearTipo = useCallback(() => {
    setTipo(null);
  }, []);

  const clearTipos = useCallback(() => {
    setTipos([]);
    setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
  }, []);

  const clearAplicado = useCallback(() => {
    setAplicado(null);
  }, []);

  const clearAplicados = useCallback(() => {
    setAplicados([]);
    setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
  }, []);

  return {
    // Estado - Tipos
    tipos,
    tipo,
    statsTipos,

    // Estado - Aplicados
    aplicados,
    aplicado,
    statsAplicados,

    // Estado general
    loading,
    pagination,

    // Métodos - Tipos
    loadTipos,
    loadTipo,
    loadTiposByServicio,
    createTipo,
    updateTipo,
    deleteTipo,
    loadStatsTipos,

    // Métodos - Aplicados
    aplicar,
    loadAplicados,
    loadAplicado,
    loadByPaciente,
    registrarFirma,
    loadStatsAplicados,
    generarPDF,

    // Utilidades
    clearTipo,
    clearTipos,
    clearAplicado,
    clearAplicados,
  };
}
