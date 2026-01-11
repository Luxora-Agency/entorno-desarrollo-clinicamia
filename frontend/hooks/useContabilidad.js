'use client';

import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para gestionar el módulo de contabilidad
 * Incluye asientos contables, plan de cuentas y reportes
 */
export function useContabilidad() {
  const [asientos, setAsientos] = useState([]);
  const [asiento, setAsiento] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // ============ ASIENTOS CONTABLES ============

  const fetchAsientos = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        ...(params.estado && { estado: params.estado }),
        ...(params.tipo && { tipo: params.tipo }),
        ...(params.fechaInicio && { fechaInicio: params.fechaInicio }),
        ...(params.fechaFin && { fechaFin: params.fechaFin })
      }).toString();

      const response = await apiGet(`/contabilidad/asientos?${queryParams}`);
      if (response.success) {
        setAsientos(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar asientos: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchAsiento = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet(`/contabilidad/asientos/${id}`);
      if (response.success) {
        setAsiento(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar asiento: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createAsiento = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/contabilidad/asientos', data);
      if (response.success) {
        toast.success('Asiento creado exitosamente');
        await fetchAsientos();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al crear asiento: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAsientos]);

  const updateAsiento = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPut(`/contabilidad/asientos/${id}`, data);
      if (response.success) {
        toast.success('Asiento actualizado exitosamente');
        await fetchAsientos();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al actualizar asiento: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAsientos]);

  const aprobarAsiento = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost(`/contabilidad/asientos/${id}/aprobar`);
      if (response.success) {
        toast.success('Asiento aprobado exitosamente');
        await fetchAsientos();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al aprobar asiento: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAsientos]);

  const anularAsiento = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost(`/contabilidad/asientos/${id}/anular`);
      if (response.success) {
        toast.success('Asiento anulado exitosamente');
        await fetchAsientos();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al anular asiento: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAsientos]);

  const deleteAsiento = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiDelete(`/contabilidad/asientos/${id}`);
      if (response.success) {
        toast.success('Asiento eliminado exitosamente');
        await fetchAsientos();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al eliminar asiento: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAsientos]);

  // ============ PLAN DE CUENTAS ============

  const fetchCuentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet('/contabilidad/cuentas');
      if (response.success) {
        setCuentas(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const syncCuentasFromSiigo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/contabilidad/cuentas/sync');
      if (response.success) {
        toast.success('Plan de cuentas sincronizado desde Siigo');
        await fetchCuentas();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al sincronizar cuentas: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchCuentas]);

  // ============ REPORTES ============

  const getBalancePrueba = useCallback(async (fechaInicio, fechaFin) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ fechaInicio, fechaFin }).toString();
      const response = await apiGet(`/contabilidad/reportes/balance-prueba?${params}`);
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al obtener balance de prueba: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getCuentasPorPagar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet('/contabilidad/reportes/cuentas-por-pagar');
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al obtener cuentas por pagar: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getBalanceDocumentos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet('/contabilidad/reportes/balance-documentos');
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al obtener balance de documentos: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============ CATÁLOGOS ============

  const getCatalogos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [grupos, centrosCosto, tiposPago] = await Promise.all([
        apiGet('/contabilidad/catalogos/grupos-contables'),
        apiGet('/contabilidad/catalogos/centros-costo'),
        apiGet('/contabilidad/catalogos/tipos-pago')
      ]);
      return {
        success: true,
        data: {
          gruposContables: grupos.data || [],
          centrosCosto: centrosCosto.data || [],
          tiposPago: tiposPago.data || []
        }
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    asientos,
    asiento,
    cuentas,
    loading,
    error,
    pagination,

    // Asientos
    fetchAsientos,
    fetchAsiento,
    createAsiento,
    updateAsiento,
    aprobarAsiento,
    anularAsiento,
    deleteAsiento,

    // Cuentas
    fetchCuentas,
    syncCuentasFromSiigo,

    // Reportes
    getBalancePrueba,
    getCuentasPorPagar,
    getBalanceDocumentos,

    // Catálogos
    getCatalogos,

    // Pagination
    setPage: (page) => setPagination(prev => ({ ...prev, page })),
    setLimit: (limit) => setPagination(prev => ({ ...prev, limit }))
  };
}

export default useContabilidad;
