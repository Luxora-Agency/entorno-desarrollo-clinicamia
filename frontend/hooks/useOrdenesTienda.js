'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPut, apiPost } from '@/services/api';
import { toast } from 'sonner';

export function useOrdenesTienda() {
  const [ordenes, setOrdenes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    estado: '',
    search: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  const fetchOrdenes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      if (filters.estado) params.append('estado', filters.estado);
      if (filters.search) params.append('search', filters.search);
      if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
      if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);

      const response = await apiGet(`/ordenes-tienda?${params.toString()}`);
      if (response.success) {
        setOrdenes(response.data || []);
        setPagination(prev => ({
          ...prev,
          ...(response.pagination || {}),
        }));
      }
    } catch (error) {
      console.error('Error fetching shop orders:', error);
      toast.error('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiGet('/ordenes-tienda/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getOrden = async (id) => {
    try {
      const response = await apiGet(`/ordenes-tienda/${id}`);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Error al cargar la orden');
      return null;
    }
  };

  const updateEstado = async (id, estado, datos = {}) => {
    try {
      const response = await apiPut(`/ordenes-tienda/${id}/estado`, { estado, ...datos });
      if (response.success) {
        toast.success(`Estado actualizado a ${estado}`);
        fetchOrdenes();
        fetchStats();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Error al actualizar estado');
      return null;
    }
  };

  // Marcar como en proceso (descuenta stock)
  const marcarProcesando = async (id, comentario = '') => {
    try {
      const response = await apiPost(`/ordenes-tienda/${id}/procesar`, { comentario });
      if (response.success) {
        toast.success('Orden marcada como en proceso');
        fetchOrdenes();
        fetchStats();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error(error.message || 'Error al procesar orden');
      return null;
    }
  };

  // Marcar como enviado
  const marcarEnviado = async (id, datosEnvio) => {
    try {
      const response = await apiPost(`/ordenes-tienda/${id}/enviar`, datosEnvio);
      if (response.success) {
        toast.success('Orden marcada como enviada');
        fetchOrdenes();
        fetchStats();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Error marking as shipped:', error);
      toast.error(error.message || 'Error al marcar como enviado');
      return null;
    }
  };

  // Marcar como entregado
  const marcarEntregado = async (id, comentario = '') => {
    try {
      const response = await apiPost(`/ordenes-tienda/${id}/entregar`, { comentario });
      if (response.success) {
        toast.success('Orden marcada como entregada');
        fetchOrdenes();
        fetchStats();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Error marking as delivered:', error);
      toast.error(error.message || 'Error al marcar como entregado');
      return null;
    }
  };

  const updateEnvio = async (id, datosEnvio) => {
    try {
      const response = await apiPut(`/ordenes-tienda/${id}/envio`, datosEnvio);
      if (response.success) {
        toast.success('Información de envío actualizada');
        fetchOrdenes();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Error updating shipping:', error);
      toast.error(error.message || 'Error al actualizar envío');
      return null;
    }
  };

  const addNota = async (id, nota) => {
    try {
      const response = await apiPost(`/ordenes-tienda/${id}/notas`, { nota });
      if (response.success) {
        toast.success('Nota agregada');
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error(error.message || 'Error al agregar nota');
      return null;
    }
  };

  const cancelarOrden = async (id, motivo) => {
    try {
      const response = await apiPost(`/ordenes-tienda/${id}/cancelar`, { motivo });
      if (response.success) {
        toast.success('Orden cancelada');
        fetchOrdenes();
        fetchStats();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      console.error('Error canceling order:', error);
      toast.error(error.message || 'Error al cancelar orden');
      return null;
    }
  };

  const setPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const refresh = () => {
    fetchOrdenes();
    fetchStats();
  };

  return {
    ordenes,
    stats,
    loading,
    pagination,
    filters,
    setFilters,
    setPage,
    getOrden,
    updateEstado,
    marcarProcesando,
    marcarEnviado,
    marcarEntregado,
    updateEnvio,
    addNota,
    cancelarOrden,
    refresh,
  };
}
