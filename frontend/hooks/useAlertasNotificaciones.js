'use client';

import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api';

const BASE_URL = '/alertas-notificaciones';

/**
 * Hook para gestionar alertas y notificaciones por email
 */
export default function useAlertasNotificaciones() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [configuraciones, setConfiguraciones] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [pagination, setPagination] = useState(null);

  // Helper para llamadas API
  const apiCall = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (err) {
      setError(err.message || 'Error en la operacion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ ESTADO ============

  const getEstado = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/estado`));
  }, [apiCall]);

  const enviarPrueba = useCallback(async (email) => {
    return apiCall(() => apiPost(`${BASE_URL}/test`, { email }));
  }, [apiCall]);

  // ============ CONFIGURACIONES ============

  const fetchConfiguraciones = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/configuraciones${query ? `?${query}` : ''}`));
    setConfiguraciones(data);
    return data;
  }, [apiCall]);

  const getConfiguracion = useCallback(async (id) => {
    return apiCall(() => apiGet(`${BASE_URL}/configuraciones/${id}`));
  }, [apiCall]);

  const saveConfiguracion = useCallback(async (data) => {
    const result = await apiCall(() => apiPost(`${BASE_URL}/configuraciones`, data));
    await fetchConfiguraciones();
    return result;
  }, [apiCall, fetchConfiguraciones]);

  const toggleConfiguracion = useCallback(async (id) => {
    const result = await apiCall(() => apiPatch(`${BASE_URL}/configuraciones/${id}/toggle`));
    await fetchConfiguraciones();
    return result;
  }, [apiCall, fetchConfiguraciones]);

  // ============ DESTINATARIOS ============

  const agregarDestinatario = useCallback(async (configuracionId, data) => {
    return apiCall(() => apiPost(`${BASE_URL}/configuraciones/${configuracionId}/destinatarios`, data));
  }, [apiCall]);

  const eliminarDestinatario = useCallback(async (id) => {
    return apiCall(() => apiDelete(`${BASE_URL}/destinatarios/${id}`));
  }, [apiCall]);

  // ============ HISTORIAL ============

  const fetchHistorial = useCallback(async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data = await apiCall(() => apiGet(`${BASE_URL}/historial${query ? `?${query}` : ''}`));
    setHistorial(data.data || data);
    setPagination(data.pagination);
    return data;
  }, [apiCall]);

  const reintentarAlerta = useCallback(async (id) => {
    return apiCall(() => apiPost(`${BASE_URL}/historial/${id}/reintentar`));
  }, [apiCall]);

  // ============ ENVÍO ============

  const enviarAlerta = useCallback(async (data) => {
    return apiCall(() => apiPost(`${BASE_URL}/enviar`, data));
  }, [apiCall]);

  const procesarPendientes = useCallback(async () => {
    return apiCall(() => apiPost(`${BASE_URL}/procesar-pendientes`));
  }, [apiCall]);

  // ============ CATÁLOGOS ============

  const getTiposAlerta = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/tipos`));
  }, [apiCall]);

  const getFrecuencias = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/frecuencias`));
  }, [apiCall]);

  const getPrioridades = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/prioridades`));
  }, [apiCall]);

  const getTiposDestinatario = useCallback(async () => {
    return apiCall(() => apiGet(`${BASE_URL}/tipos-destinatario`));
  }, [apiCall]);

  return {
    // State
    loading,
    error,
    configuraciones,
    historial,
    pagination,

    // Estado
    getEstado,
    enviarPrueba,

    // Configuraciones
    fetchConfiguraciones,
    getConfiguracion,
    saveConfiguracion,
    toggleConfiguracion,

    // Destinatarios
    agregarDestinatario,
    eliminarDestinatario,

    // Historial
    fetchHistorial,
    reintentarAlerta,

    // Envío
    enviarAlerta,
    procesarPendientes,

    // Catálogos
    getTiposAlerta,
    getFrecuencias,
    getPrioridades,
    getTiposDestinatario,
  };
}
