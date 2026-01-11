/**
 * Hook para gestión de Vigilancia en Salud Pública
 * SIVIGILA, Farmacovigilancia, Tecnovigilancia
 */
import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';

export const useVigilanciaSalud = () => {
  const [notificacionesSIVIGILA, setNotificacionesSIVIGILA] = useState([]);
  const [reportesFarmacovigilancia, setReportesFarmacovigilancia] = useState([]);
  const [reportesTecnovigilancia, setReportesTecnovigilancia] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // SIVIGILA - NOTIFICACIONES EPIDEMIOLÓGICAS
  // ==========================================

  const fetchNotificacionesSIVIGILA = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/sivigila', { limit: 100, ...params });
      setNotificacionesSIVIGILA(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getNotificacionSIVIGILAById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/vigilancia-salud/sivigila/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createNotificacionSIVIGILA = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/vigilancia-salud/sivigila', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateNotificacionSIVIGILA = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/vigilancia-salud/sivigila/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarEnviadoINS = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/vigilancia-salud/sivigila/${id}/enviar-ins`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotificacionesPorSemana = useCallback(async (semana, anio) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/sivigila', {
        semanaEpidemiologica: semana,
        anioEpidemiologico: anio,
      });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotificacionesPendientesINS = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/sivigila', { enviadoINS: false });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // FARMACOVIGILANCIA
  // ==========================================

  const fetchReportesFarmacovigilancia = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/farmacovigilancia', { limit: 100, ...params });
      setReportesFarmacovigilancia(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getReporteFarmacovigilanciaById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/vigilancia-salud/farmacovigilancia/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createReporteFarmacovigilancia = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/vigilancia-salud/farmacovigilancia', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReporteFarmacovigilancia = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/vigilancia-salud/farmacovigilancia/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarReportadoINVIMAFarmaco = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/vigilancia-salud/farmacovigilancia/${id}/reportar-invima`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReportesFarmacoPendientesINVIMA = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/farmacovigilancia', { reportadoINVIMA: false });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // TECNOVIGILANCIA
  // ==========================================

  const fetchReportesTecnovigilancia = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/tecnovigilancia', { limit: 100, ...params });
      setReportesTecnovigilancia(response.data || []);
      return { success: true, data: response.data, pagination: response.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getReporteTecnovigilanciaById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/vigilancia-salud/tecnovigilancia/${id}`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createReporteTecnovigilancia = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost('/vigilancia-salud/tecnovigilancia', data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReporteTecnovigilancia = useCallback(async (id, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPut(`/vigilancia-salud/tecnovigilancia/${id}`, data);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarReportadoINVIMATecno = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiPost(`/vigilancia-salud/tecnovigilancia/${id}/reportar-invima`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReportesTecnoPendientesINVIMA = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/tecnovigilancia', { reportadoINVIMA: false });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // EVENTOS DE NOTIFICACIÓN
  // ==========================================

  const getEventosNotificacion = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/eventos');
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEventosInmediatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/eventos', { tipo: 'Inmediata' });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // EXPORTACIÓN
  // ==========================================

  const exportarFichaSIVIGILA = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/vigilancia-salud/sivigila/${id}/ficha`);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const exportarArchivoPlanoSIVIGILA = useCallback(async (semana, anio) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/sivigila/exportar/plano', { semana, anio });
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const exportarReporteINVIMA = useCallback(async (tipo, params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet(`/vigilancia-salud/${tipo}/exportar/invima`, params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // DASHBOARD Y ESTADÍSTICAS
  // ==========================================

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/dashboard');
      setDashboard(response.data?.dashboard || null);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasSIVIGILA = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/sivigila/estadisticas', params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasFarmacovigilancia = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/farmacovigilancia/estadisticas', params);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEstadisticasTecnovigilancia = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGet('/vigilancia-salud/tecnovigilancia/estadisticas', params);
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
    notificacionesSIVIGILA,
    reportesFarmacovigilancia,
    reportesTecnovigilancia,
    dashboard,
    loading,
    error,
    // SIVIGILA
    fetchNotificacionesSIVIGILA,
    getNotificacionSIVIGILAById,
    createNotificacionSIVIGILA,
    updateNotificacionSIVIGILA,
    marcarEnviadoINS,
    fetchNotificacionesPorSemana,
    fetchNotificacionesPendientesINS,
    // Farmacovigilancia
    fetchReportesFarmacovigilancia,
    getReporteFarmacovigilanciaById,
    createReporteFarmacovigilancia,
    updateReporteFarmacovigilancia,
    marcarReportadoINVIMAFarmaco,
    fetchReportesFarmacoPendientesINVIMA,
    // Tecnovigilancia
    fetchReportesTecnovigilancia,
    getReporteTecnovigilanciaById,
    createReporteTecnovigilancia,
    updateReporteTecnovigilancia,
    marcarReportadoINVIMATecno,
    fetchReportesTecnoPendientesINVIMA,
    // Eventos
    getEventosNotificacion,
    getEventosInmediatos,
    // Exportación
    exportarFichaSIVIGILA,
    exportarArchivoPlanoSIVIGILA,
    exportarReporteINVIMA,
    // Dashboard
    fetchDashboard,
    getEstadisticasSIVIGILA,
    getEstadisticasFarmacovigilancia,
    getEstadisticasTecnovigilancia,
  };
};
