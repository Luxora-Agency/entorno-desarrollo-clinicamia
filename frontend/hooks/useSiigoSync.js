'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para gestionar la configuración y sincronización con Siigo
 */
export function useSiigoSync() {
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState(null);
  const [syncErrors, setSyncErrors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [catalogs, setCatalogs] = useState({
    taxes: [],
    paymentTypes: [],
    documentTypes: [],
    accountGroups: [],
    costCenters: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============ CONFIGURACIÓN ============

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet('/siigo');
      if (response.success) {
        setConfig(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConfig = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPut('/siigo', data);
      if (response.success) {
        toast.success('Configuración guardada exitosamente');
        setConfig(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al guardar configuración: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/siigo/test');
      if (response.success) {
        toast.success('Conexión exitosa con Siigo');
      } else {
        toast.error('Error de conexión: ' + (response.message || 'Credenciales inválidas'));
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al probar conexión: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/siigo/connect');
      if (response.success) {
        toast.success('Conectado a Siigo exitosamente');
        await fetchStatus();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al conectar con Siigo: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ ESTADO DE SINCRONIZACIÓN ============

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet('/siigo/status');
      if (response.success) {
        setStatus(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSyncErrors = useCallback(async (limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet(`/siigo/errors?limit=${limit}`);
      if (response.success) {
        setSyncErrors(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (limit = 100) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet(`/siigo/logs?limit=${limit}`);
      if (response.success) {
        setLogs(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ CATÁLOGOS ============

  const fetchCatalogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [taxes, paymentTypes, documentTypes, accountGroups, costCenters] = await Promise.all([
        apiGet('/siigo/catalogs/taxes'),
        apiGet('/siigo/catalogs/payment-types'),
        apiGet('/siigo/catalogs/document-types'),
        apiGet('/siigo/catalogs/account-groups'),
        apiGet('/siigo/catalogs/cost-centers')
      ]);

      const catalogData = {
        taxes: taxes.data || [],
        paymentTypes: paymentTypes.data || [],
        documentTypes: documentTypes.data || [],
        accountGroups: accountGroups.data || [],
        costCenters: costCenters.data || []
      };

      setCatalogs(catalogData);
      return { success: true, data: catalogData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const syncCatalogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/siigo/catalogs/sync');
      if (response.success) {
        toast.success('Catálogos sincronizados exitosamente');
        await fetchCatalogs();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al sincronizar catálogos: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchCatalogs]);

  // ============ SINCRONIZACIÓN MANUAL ============

  const syncClientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/siigo/sync/clientes');
      if (response.success) {
        toast.success(`Sincronizados ${response.data?.count || 0} clientes`);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al sincronizar clientes: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const syncProductos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/siigo/sync/productos');
      if (response.success) {
        toast.success(`Sincronizados ${response.data?.count || 0} productos`);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al sincronizar productos: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const retrySyncErrors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/siigo/sync/retry-errors');
      if (response.success) {
        toast.success(`${response.data?.retried || 0} errores reintentados`);
        await fetchSyncErrors();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al reintentar sincronizaciones: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchSyncErrors]);

  // ============ ESTADO DERIVADO ============

  const isConnected = status?.connected === true;
  const hasErrors = syncErrors.length > 0;
  const pendingSyncs = status?.pendingSyncs || 0;

  return {
    // State
    config,
    status,
    syncErrors,
    logs,
    catalogs,
    loading,
    error,

    // Derived state
    isConnected,
    hasErrors,
    pendingSyncs,

    // Configuración
    fetchConfig,
    saveConfig,
    testConnection,
    connect,

    // Estado
    fetchStatus,
    fetchSyncErrors,
    fetchLogs,

    // Catálogos
    fetchCatalogs,
    syncCatalogs,

    // Sincronización manual
    syncClientes,
    syncProductos,
    retrySyncErrors
  };
}

export default useSiigoSync;
