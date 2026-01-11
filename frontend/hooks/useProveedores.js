'use client';

import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/services/api';
import { toast } from 'sonner';

/**
 * Hook para gestionar proveedores, órdenes de compra y facturas de proveedor
 */
export function useProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedor, setProveedor] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [orden, setOrden] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [factura, setFactura] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // ============ PROVEEDORES ============

  const fetchProveedores = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        ...(params.search && { search: params.search }),
        ...(params.tipo && { tipo: params.tipo })
      }).toString();

      const response = await apiGet(`/compras/proveedores?${queryParams}`);
      if (response.success) {
        setProveedores(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar proveedores: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchProveedor = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet(`/compras/proveedores/${id}`);
      if (response.success) {
        setProveedor(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar proveedor: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createProveedor = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/compras/proveedores', data);
      if (response.success) {
        toast.success('Proveedor creado exitosamente');
        await fetchProveedores();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al crear proveedor: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchProveedores]);

  const updateProveedor = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPut(`/compras/proveedores/${id}`, data);
      if (response.success) {
        toast.success('Proveedor actualizado exitosamente');
        await fetchProveedores();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al actualizar proveedor: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchProveedores]);

  // ============ ÓRDENES DE COMPRA ============

  const fetchOrdenes = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.estado && { estado: params.estado })
      }).toString();

      const response = await apiGet(`/compras/ordenes?${queryParams}`);
      if (response.success) {
        setOrdenes(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar órdenes: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrden = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet(`/compras/ordenes/${id}`);
      if (response.success) {
        setOrden(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar orden: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrden = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/compras/ordenes', data);
      if (response.success) {
        toast.success('Orden de compra creada exitosamente');
        await fetchOrdenes();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al crear orden: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchOrdenes]);

  const aprobarOrden = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost(`/compras/ordenes/${id}/aprobar`);
      if (response.success) {
        toast.success('Orden aprobada exitosamente');
        await fetchOrdenes();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al aprobar orden: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchOrdenes]);

  const registrarRecepcion = useCallback(async (ordenId, items) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost(`/compras/ordenes/${ordenId}/recepcion`, { items });
      if (response.success) {
        toast.success('Recepción registrada exitosamente');
        await fetchOrdenes();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al registrar recepción: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchOrdenes]);

  // ============ FACTURAS DE PROVEEDOR ============

  const fetchFacturas = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.estado && { estado: params.estado })
      }).toString();

      const response = await apiGet(`/compras/facturas?${queryParams}`);
      if (response.success) {
        setFacturas(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar facturas: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const createFactura = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/compras/facturas', data);
      if (response.success) {
        toast.success('Factura de proveedor registrada exitosamente');
        await fetchFacturas();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al registrar factura: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchFacturas]);

  const registrarPago = useCallback(async (facturaId, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost(`/compras/facturas/${facturaId}/pago`, data);
      if (response.success) {
        toast.success('Pago registrado exitosamente');
        await fetchFacturas();
      }
      return response;
    } catch (err) {
      setError(err.message);
      toast.error('Error al registrar pago: ' + err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchFacturas]);

  // ============ ESTADÍSTICAS ============

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet('/compras/stats');
      if (response.success) {
        setStats(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    proveedores,
    proveedor,
    ordenes,
    orden,
    facturas,
    factura,
    stats,
    loading,
    error,
    pagination,

    // Proveedores
    fetchProveedores,
    fetchProveedor,
    createProveedor,
    updateProveedor,

    // Órdenes de Compra
    fetchOrdenes,
    fetchOrden,
    createOrden,
    aprobarOrden,
    registrarRecepcion,

    // Facturas de Proveedor
    fetchFacturas,
    createFactura,
    registrarPago,

    // Stats
    fetchStats,

    // Pagination
    setPage: (page) => setPagination(prev => ({ ...prev, page })),
    setLimit: (limit) => setPagination(prev => ({ ...prev, limit }))
  };
}

export default useProveedores;
